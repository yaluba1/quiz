export interface EmailTranslations {
  verification: {
    subject: string;
    headline: string;
    greeting: string;
    body: string;
    button: string;
    fallbackLink: string;
    disregard: string;
    signoff: string;
  };
  passwordReset: {
    subject: string;
    headline: string;
    greeting: string;
    body: string;
    button: string;
    warning: string;
    fallbackLink: string;
    disregard: string;
    signoff: string;
  };
}

export const EMAIL_TRANSLATIONS: Record<string, EmailTranslations> = {
  en: {
    verification: {
      subject: 'Verify your Professor account - Open Quiz Platform',
      headline: 'Welcome to Open Quiz Platform!',
      greeting: 'Hello',
      body: 'Thank you for creating a professor account. To activate your account and start building quizzes, please verify your email address by clicking the button below:',
      button: 'Verify My Account',
      fallbackLink: 'Or copy and paste this verification link into your browser:',
      disregard: 'If you did not register for an account, please disregard this email.',
      signoff: 'Best regards,\nOpen Quiz Platform Team',
    },
    passwordReset: {
      subject: 'Password Reset Request - Open Quiz Platform',
      headline: 'Password Reset Request',
      greeting: 'Hello',
      body: 'We received a request to reset the password for your professor account. Click the button below to define a new password:',
      button: 'Reset Password',
      warning: 'Important: This password reset link is valid for 15 minutes only.',
      fallbackLink: 'Or copy and paste this link into your browser:',
      disregard: 'If you did not request this change, please ignore this email and your password will remain unchanged.',
      signoff: 'Best regards,\nOpen Quiz Platform Team',
    },
  },
  es: {
    verification: {
      subject: 'Verifica tu cuenta de profesor - Open Quiz Platform',
      headline: '¡Bienvenido/a a Open Quiz Platform!',
      greeting: 'Hola',
      body: 'Gracias por crear tu cuenta de profesor. Para activar tu cuenta y comenzar a crear cuestionarios interactivos, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:',
      button: 'Verificar mi cuenta',
      fallbackLink: 'O copia y pega este enlace de verificación en tu navegador:',
      disregard: 'Si no solicitaste el registro de esta cuenta, puedes ignorar este mensaje.',
      signoff: 'Atentamente,\nEl equipo de Open Quiz Platform',
    },
    passwordReset: {
      subject: 'Restablecimiento de contraseña - Open Quiz Platform',
      headline: 'Restablecimiento de contraseña',
      greeting: 'Hola',
      body: 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de profesor. Haz clic en el siguiente botón para definir una nueva contraseña:',
      button: 'Restablecer contraseña',
      warning: 'Importante: Este enlace de restablecimiento solo es válido durante 15 minutos.',
      fallbackLink: 'O copia y pega este enlace en tu navegador:',
      disregard: 'Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña permanecerá sin cambios.',
      signoff: 'Atentamente,\nEl equipo de Open Quiz Platform',
    },
  },
  ca: {
    verification: {
      subject: 'Verifica el teu compte de professor - Open Quiz Platform',
      headline: 'Benvingut/da a Open Quiz Platform!',
      greeting: 'Hola',
      body: 'Gràcies per crear el teu compte de professor. Per activar el teu compte i començar a crear qüestionaris interactius, si us plau verifica el teu correu fent clic al següent botó:',
      button: 'Verificar el meu compte',
      fallbackLink: 'O copia i enganxa aquest enllaç de verificació al teu navegador:',
      disregard: 'Si no has sol·licitat aquest registre, pots ignorar aquest missatge.',
      signoff: 'Cordialment,\nL\'equip d\'Open Quiz Platform',
    },
    passwordReset: {
      subject: 'Restabliment de contrasenya - Open Quiz Platform',
      headline: 'Restabliment de contrasenya',
      greeting: 'Hola',
      body: 'Hem rebut una sol·licitud per restablir la contrasenya del teu compte de professor. Fes clic al botó següent per definir una nova contrasenya:',
      button: 'Restablir contrasenya',
      warning: 'Important: Aquest enllaç de restabliment només és vàlid durant 15 minuts.',
      fallbackLink: 'O copia i enganxa aquest enllaç al teu navegador:',
      disregard: 'Si no has sol·licitat aquest canvi, pots ignorar aquest correu i la teva contrasenya no es modificarà.',
      signoff: 'Cordialment,\nL\'equip d\'Open Quiz Platform',
    },
  },
  fr: {
    verification: {
      subject: 'Vérifiez votre compte Enseignant - Open Quiz Platform',
      headline: 'Bienvenue sur Open Quiz Platform !',
      greeting: 'Bonjour',
      body: 'Merci d\'avoir créé un compte enseignant. Pour activer votre compte et commencer à créer des quiz, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :',
      button: 'Activer mon compte',
      fallbackLink: 'Ou copiez et collez ce lien de vérification dans votre navigateur :',
      disregard: 'Si vous n\'avez pas créé ce compte, vous pouvez ignorer cet email en toute sécurité.',
      signoff: 'Cordialement,\nL\'équipe Open Quiz Platform',
    },
    passwordReset: {
      subject: 'Réinitialisation de mot de passe - Open Quiz Platform',
      headline: 'Réinitialisation de mot de passe',
      greeting: 'Bonjour',
      body: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte enseignant. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :',
      button: 'Réinitialiser le mot de passe',
      warning: 'Important : Ce lien de réinitialisation est valable pendant 15 minutes seulement.',
      fallbackLink: 'Ou copiez et collez ce lien dans votre navigateur :',
      disregard: 'Si vous n\'avez pas demandé ce changement, ignorez cet email et votre mot de passe restera inchangé.',
      signoff: 'Cordialement,\nL\'équipe Open Quiz Platform',
    },
  },
  de: {
    verification: {
      subject: 'Bestätigen Sie Ihr Lehrkraft-Konto - Open Quiz Platform',
      headline: 'Willkommen bei Open Quiz Platform!',
      greeting: 'Hallo',
      body: 'Vielen Dank für die Registrierung Ihres Lehrkraft-Kontos. Um Ihr Konto zu aktivieren und Quizze zu erstellen, bestätigen Sie bitte Ihre E-Mail-Adresse über die folgende Schaltfläche:',
      button: 'Mein Konto aktivieren',
      fallbackLink: 'Oder kopieren Sie diesen Bestätigungslink in Ihren Browser:',
      disregard: 'Wenn Sie dieses Konto nicht erstellt haben, ignorieren Sie diese E-Mail bitte.',
      signoff: 'Mit freundlichen Grüßen,\nIhr Open Quiz Platform Team',
    },
    passwordReset: {
      subject: 'Passwort zurücksetzen - Open Quiz Platform',
      headline: 'Passwort zurücksetzen',
      greeting: 'Hallo',
      body: 'Wir haben eine Anfrage zum Zurücksetzen Ihres Lehrkraft-Passworts erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort festzulegen:',
      button: 'Passwort zurücksetzen',
      warning: 'Wichtig: Dieser Link zum Zurücksetzen des Passworts ist nur 15 Minuten lang gültig.',
      fallbackLink: 'Oder kopieren Sie diesen Link in Ihren Browser:',
      disregard: 'Wenn Sie diese Änderung nicht angefordert haben, ignorieren Sie diese E-Mail bitte.',
      signoff: 'Mit freundlichen Grüßen,\nIhr Open Quiz Platform Team',
    },
  },
  it: {
    verification: {
      subject: 'Verifica il tuo account Docente - Open Quiz Platform',
      headline: 'Benvenuto/a su Open Quiz Platform!',
      greeting: 'Ciao',
      body: 'Grazie per aver creato un account docente. Per attivare il tuo account e iniziare a creare quiz, conferma il tuo indirizzo email cliccando sul pulsante sottostante:',
      button: 'Verifica il mio account',
      fallbackLink: 'Oppure copia e incolla questo link di verifica nel tuo browser:',
      disregard: 'Se non hai effettuato questa registrazione, puoi ignorare questa email.',
      signoff: 'Cordiali saluti,\nIl team di Open Quiz Platform',
    },
    passwordReset: {
      subject: 'Richiesta di reimpostazione password - Open Quiz Platform',
      headline: 'Reimpostazione password',
      greeting: 'Ciao',
      body: 'Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account docente. Clicca sul pulsante qui sotto per impostare una nuova password:',
      button: 'Reimposta la password',
      warning: 'Importante: Questo link per la reimpostazione è valido solo per 15 minuti.',
      fallbackLink: 'Oppure copia e incolla questo link nel tuo browser:',
      disregard: 'Se non hai richiesto questa modifica, ignora questa email e la tua password rimarrà invariata.',
      signoff: 'Cordiali saluti,\nIl team di Open Quiz Platform',
    },
  },
  pt: {
    verification: {
      subject: 'Verifique a sua conta de Professor - Open Quiz Platform',
      headline: 'Bem-vindo/a à Open Quiz Platform!',
      greeting: 'Olá',
      body: 'Obrigado por criar a sua conta de professor. Para ativar a sua conta e começar a criar questionários, por favor verifique o seu endereço de email clicando no botão abaixo:',
      button: 'Verificar a minha conta',
      fallbackLink: 'Ou copie e cole este link de verificação no seu navegador:',
      disregard: 'Se não efetuou este registo, pode ignorar esta mensagem.',
      signoff: 'Com os melhores cumprimentos,\nA equipa Open Quiz Platform',
    },
    passwordReset: {
      subject: 'Redefinição de palavra-passe - Open Quiz Platform',
      headline: 'Redefinição de palavra-passe',
      greeting: 'Olá',
      body: 'Recebemos um pedido para redefinir a palavra-passe da sua conta de professor. Clique no botão abaixo para definir uma nova palavra-passe:',
      button: 'Redefinir palavra-passe',
      warning: 'Importante: Esta ligação de redefinição é válida apenas por 15 minutos.',
      fallbackLink: 'Ou copie e cole esta ligação no seu navegador:',
      disregard: 'Se não solicitou esta alteração, ignore esta mensagem e a sua palavra-passe permanecerá inalterada.',
      signoff: 'Com os melhores cumprimentos,\nA equipa Open Quiz Platform',
    },
  },
  ja: {
    verification: {
      subject: 'アカウントの確認 - Open Quiz Platform',
      headline: 'Open Quiz Platform へようこそ！',
      greeting: 'こんにちは',
      body: '講師アカウントを作成いただきありがとうございます。アカウントを有効化してクイズの作成を開始するには、以下のボタンをクリックしてメールアドレスを確認してください。',
      button: 'アカウントを確認する',
      fallbackLink: 'または、以下のリンクをブラウザに直接貼り付けてアクセスしてください：',
      disregard: 'このメールに心当たりがない場合は、安全に破棄してください。',
      signoff: 'よろしくお願いいたします。\nOpen Quiz Platform チーム',
    },
    passwordReset: {
      subject: 'パスワード再設定のご案内 - Open Quiz Platform',
      headline: 'パスワード再設定',
      greeting: 'こんにちは',
      body: '講師アカウントのパスワード再設定リクエストを受け付けました。以下のボタンをクリックして新しいパスワードを設定してください。',
      button: 'パスワードを再設定する',
      warning: '重要：この再設定リンクの有効期限は15分間のみです。',
      fallbackLink: 'または、以下のリンクをブラウザに直接貼り付けてアクセスしてください：',
      disregard: 'このリクエストを行っていない場合は、このメールを無視してください。パスワードは変更されません。',
      signoff: 'よろしくお願いいたします。\nOpen Quiz Platform チーム',
    },
  },
};

export function getEmailTranslations(locale?: string): EmailTranslations {
  if (!locale) return EMAIL_TRANSLATIONS.en;
  const normalized = locale.toLowerCase().split(/[-_]/)[0];
  return EMAIL_TRANSLATIONS[normalized] || EMAIL_TRANSLATIONS.en;
}

