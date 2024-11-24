import './globals.css'
import { Inter, Poppins } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({ weight: ['400', '600', '700'], subsets: ['latin'], variable: '--font-poppins' })

export const metadata = {
  title: 'SoBuddy - Tu Compañero en el Viaje Sobrio',
  description: 'SoBuddy es tu aliado en WhatsApp para manejar la adicción al alcohol.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  )
}

