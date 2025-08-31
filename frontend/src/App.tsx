import { Authenticator } from '@aws-amplify/ui-react'
import './App.css'
import '@aws-amplify/ui-react/styles.css'
import { I18n } from 'aws-amplify/utils'
import { translations } from '@aws-amplify/ui-react'

// 日本語を適用
I18n.putVocabularies(translations);
I18n.setLanguage('ja');

function App() {

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div>
          <h1>ようこそ {user?.username} さん</h1>
          <button onClick={signOut}>サインアウト</button>
        </div>
      )}
    </Authenticator>
  );
}

export default App
