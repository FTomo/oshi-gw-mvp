// =============================
// src/pages/Profile.tsx
// =============================
import { useRecoilState } from 'recoil'
import { currentUserAtom } from '../state/auth'
import { Box, Button, Snackbar, Stack, TextField, Typography, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Slider, Alert } from '@mui/material'
import { useCallback, useRef, useState } from 'react'
import { useUser } from '../hooks/useUser'
import Cropper, { type Area } from 'react-easy-crop'
import { uploadData, getUrl } from 'aws-amplify/storage'
import { fetchAuthSession } from 'aws-amplify/auth'

export default function Profile() {
  const [user, setUser] = useRecoilState(currentUserAtom)
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const { updateMyProfile } = useUser()

  // 画像選択 + トリミング用状態
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [uploading, setUploading] = useState(false)

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(String(reader.result))
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCropOpen(true)
    }
    reader.readAsDataURL(file)
    // クリアして同じファイルでも再選択できるように
    e.currentTarget.value = ''
  }

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const createCroppedBlob = useCallback(async (): Promise<Blob | null> => {
    if (!imageSrc || !croppedAreaPixels) return null
    // 画像読み込み
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = imageSrc
    })

    // クロップ領域をキャンバスに描画し、サイズと品質を段階的に調整して 20KB 以下を目指す
    const trySizes = [256, 192, 160, 128] // これでも超える場合は最小サイズ・最低品質で返す
    const qualities = [0.7, 0.6, 0.5, 0.4, 0.32, 0.25, 0.2, 0.16, 0.12, 0.1]
    const maxBytes = 20 * 1024

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const sx = croppedAreaPixels.x
    const sy = croppedAreaPixels.y
    const sw = croppedAreaPixels.width
    const sh = croppedAreaPixels.height

    let lastBlob: Blob | null = null
    for (const size of trySizes) {
      canvas.width = size
      canvas.height = size
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size)
      for (const q of qualities) {
        const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', q))
        lastBlob = blob
        if (blob.size <= maxBytes) return blob
      }
    }
    return lastBlob
  }, [imageSrc, croppedAreaPixels])

  const save = async () => {
    // DB には名前のみ保存（avatarUrl はアップロード時にキーで更新済み）
    await updateMyProfile({ name })
    setUser(u => (u ? { ...u, name } : u))
    setOpen(true)
  }

  const handleUploadCropped = async () => {
    if (!user?.sub) return
    try {
      setUploading(true)
  const blob = await createCroppedBlob()
      if (!blob) return
  // Auth users only（protected）では identityId 配下に保存する必要がある
  const session = await fetchAuthSession()
  const identityId = session.identityId
  if (!identityId) throw new Error('identityId not found in session')
  const key = `protected/${identityId}/avatars/${user.sub}.jpg`
  await uploadData({ path: key, data: blob, options: { contentType: 'image/jpeg' } }).result
  // DB には再現可能なキーを保存
  await updateMyProfile({ avatarUrl: key })
  // 表示用には署名URLを都度生成
  const { url } = await getUrl({ path: key, options: { expiresIn: 60 * 60 * 24 * 7 } }) // 7日
      const signed = url.toString()
      setAvatarUrl(signed)
      setUser(u => (u ? { ...u, avatarUrl: signed } : u))
      setCropOpen(false)
      setOpen(true)
  } catch (e: unknown) {
      console.error('avatar upload failed', e)
      setErrorMsg('画像アップロードに失敗しました。S3 ストレージが未設定の可能性があります。')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>プロフィール設定</Typography>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Avatar src={avatarUrl} sx={{ width: 72, height: 72 }}>{(name || user?.email || 'U')[0]}</Avatar>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="outlined" onClick={() => fileInputRef.current?.click()}>画像を選択</Button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onSelectFile} />
        </Stack>
      </Stack>
      <Stack spacing={2} sx={{ mt: 2, maxWidth: 520 }}>
        <TextField label="表示名" value={name} onChange={e => setName(e.target.value)} />
        <TextField label="メールアドレス" value={user?.email ?? ''} disabled />
        <Button variant="contained" onClick={save}>保存</Button>
      </Stack>
      <Snackbar open={open} autoHideDuration={2000} onClose={() => setOpen(false)} message="プロフィールを保存しました" />
      <Snackbar open={!!errorMsg} autoHideDuration={4000} onClose={() => setErrorMsg(null)}>
        <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>

      {/* 画像トリミングダイアログ */}
      <Dialog open={cropOpen} onClose={() => setCropOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>画像をトリミング</DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', width: '100%', height: 360, bgcolor: 'black' }}>
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition
                showGrid={false}
              />
            )}
          </Box>
          <Box sx={{ px: 1, mt: 2 }}>
            <Typography variant="caption" gutterBottom>ズーム</Typography>
            <Slider min={1} max={3} step={0.01} value={zoom} onChange={(_, v) => setZoom(v as number)} />
            <Typography variant="caption" color="text.secondary">正方形にトリミングし、20KB以下でアップロードします</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCropOpen(false)} disabled={uploading}>キャンセル</Button>
          <Button onClick={handleUploadCropped} variant="contained" disabled={uploading}>{uploading ? 'アップロード中…' : '決定してアップロード'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}