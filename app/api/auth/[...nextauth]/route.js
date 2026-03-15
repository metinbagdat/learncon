import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'

/**
 * NextAuth.js konfigürasyonu
 *
 * Vercel Environment Variables (Settings → Environment Variables):
 *   NEXTAUTH_URL            = https://learncon.vercel.app
 *   NEXTAUTH_SECRET         = (openssl rand -base64 32 ile üret)
 *   GOOGLE_CLIENT_ID        = Google Cloud Console'dan
 *   GOOGLE_CLIENT_SECRET    = Google Cloud Console'dan
 *   APPLE_ID                = Apple Developer'dan (isteğe bağlı)
 *   APPLE_TEAM_ID           = Apple Developer'dan (isteğe bağlı)
 *   APPLE_PRIVATE_KEY       = Apple Developer'dan (isteğe bağlı)
 *   APPLE_KEY_ID            = Apple Developer'dan (isteğe bağlı)
 */

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),

    // Apple Sign In (macOS / iPhone)
    ...(process.env.APPLE_ID ? [AppleProvider({
      clientId:   process.env.APPLE_ID,
      clientSecret: {
        appleId:     process.env.APPLE_ID,
        teamId:      process.env.APPLE_TEAM_ID,
        privateKey:  process.env.APPLE_PRIVATE_KEY,
        keyId:       process.env.APPLE_KEY_ID,
      },
    })] : []),

    // E-posta + Şifre (localStorage tabanlı, geliştirme için)
    CredentialsProvider({
      name: 'E-posta ile Giriş',
      credentials: {
        email:    { label: 'E-posta',  type: 'email'    },
        password: { label: 'Şifre',    type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        // Bu kısım gerçek uygulamada veritabanına bağlanmalı
        // Şimdilik localStorage tabanlı auth LearnConnectApp.jsx'de çalışıyor
        return null
      },
    }),
  ],

  pages: {
    signIn:  '/auth/login',
    signOut: '/auth/login',
    error:   '/auth/login',
  },

  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider
      }
      return token
    },
  },

  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60, // 30 gün
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
