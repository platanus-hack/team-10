import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { MessageCircle, BookOpen, Clock, MessageSquare } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 font-inter">
      <div className="backdrop-blur-sm bg-white/10">
        <header className="container mx-auto px-4 py-8">
          <div className="text-3xl font-bold text-white font-poppins">SoBuddy</div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <section className="text-center mb-24">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 leading-tight font-poppins">
              Tu compañero en <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-green-500">la sobriedad</span>
            </h1>
            <p className="text-xl text-white mb-12 max-w-2xl mx-auto leading-relaxed">
              SoBuddy es tu aliado en WhatsApp para manejar la adicción al alcohol. Obtén apoyo 24/7, sigue tu progreso y mantente motivado en tu camino hacia la recuperación.
            </p>
            <a href="https://wa.me/+56986885166?text=Hola,%20quiero%20usar%20SoBuddy!">
              <Button 
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white font-semibold text-lg py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl font-poppins"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Comienza en WhatsApp
              </Button>
            </a>
          </section>

          <section id="caracteristicas" className="grid md:grid-cols-3 gap-8 mb-24">
            {[
              { 
                icon: BookOpen, 
                title: "Diario Guiado", 
                description: "Reflexiones diarias guiadas para ayudarte a procesar tus pensamientos y emociones, fomentando el autoconocimiento y el crecimiento personal en tu viaje hacia la sobriedad."
              },
              { 
                icon: Clock, 
                title: "Apoyo en Momentos Críticos", 
                description: "Recibe orientación y recordatorios en momentos de alto riesgo durante la semana, como fines de semana o días festivos, para mantenerte enfocado en tus objetivos de sobriedad."
              },
              { 
                icon: MessageSquare, 
                title: "Conversaciones 24/7", 
                description: "Acceso a conversaciones de apoyo las 24 horas del día, los 7 días de la semana, para hablar sobre cualquier tema: desde manejo de crisis hasta celebración de éxitos en tu camino de recuperación."
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
                <feature.icon className="h-16 w-16 text-yellow-400 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4 font-poppins">{feature.title}</h3>
                <p className="text-white text-opacity-90">{feature.description}</p>
              </div>
            ))}
          </section>

          <section id="acerca" className="mb-24 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-12 rounded-3xl text-center">
            <h2 className="text-4xl font-bold text-white mb-6 font-poppins">Acerca de SoBuddy</h2>
            <div className="text-white text-opacity-90 max-w-3xl mx-auto text-lg leading-relaxed space-y-6">
              <p>
                SoBuddy fue creado con una misión simple: proporcionar apoyo accesible y compasivo para aquellos que luchan contra la adicción al alcohol. Nuestro bot de WhatsApp impulsado por IA está aquí para escuchar, guiar y alentarte las 24 horas del día, los 7 días de la semana en tu viaje hacia la sobriedad.
              </p>
              <p>
                Creemos en el poder de la tecnología para transformar vidas y hacer que el apoyo para la recuperación esté disponible para todos, en cualquier momento y en cualquier lugar.
              </p>
            </div>
          </section>

          <section id="enfoque" className="mb-24 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-12 rounded-3xl">
            <h2 className="text-4xl font-bold text-white mb-6 font-poppins text-center">Nuestro Enfoque</h2>
            <div className="text-white text-opacity-90 max-w-3xl mx-auto text-lg leading-relaxed space-y-6">
              <p>
                <strong className="font-semibold">Basado en estrategias probadas:</strong> SoBuddy utiliza técnicas de <em>Terapia Cognitivo-Conductual (TCC)</em> y <em>Terapia Dialéctica Conductual (TDC)</em> para ayudarte a:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>Identificar y cambiar patrones de pensamiento negativos</li>
                <li>Desarrollar habilidades de afrontamiento saludables</li>
                <li>Mejorar la regulación emocional</li>
              </ul>
              <p>
                Además, SoBuddy incorpora <strong className="font-semibold">técnicas de automonitoreo</strong>, permitiéndote realizar un seguimiento de tu progreso y obtener información valiosa sobre tus patrones de comportamiento.
              </p>
            </div>
          </section>
        </main>

        <footer className="bg-indigo-900 bg-opacity-50 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-6 text-lg">&copy; {new Date().getFullYear()} SoBuddy. Todos los derechos reservados.</p>
            <div className="space-x-6">
              <Link href="/privacidad" className="text-yellow-300 hover:underline text-lg font-medium transition-colors">Política de Privacidad</Link>
              <Link href="/terminos" className="text-yellow-300 hover:underline text-lg font-medium transition-colors">Términos de Servicio</Link>
              <Link href="/contacto" className="text-yellow-300 hover:underline text-lg font-medium transition-colors">Contáctanos</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

