import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { MessageCircle, BookOpen, Clock, MessageSquare } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 font-inter">
      <div className="backdrop-blur-sm bg-white/10">
        <header className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <svg 
              viewBox="0 0 32 32" 
              className="w-10 h-10 text-white"
              fill="currentColor"
            >
              <path d="M11,15.8999157 C11,15.8101079 11.0229525,15.6448613 11.0865336,15.4922775 C11.1707246,15.2902335 11.2835235,15.2000008 11.5,15.2000008 C11.7164765,15.2000008 11.8292754,15.2902335 11.9134664,15.4922775 C11.9770475,15.6448613 12,15.8101079 12,15.8999157 L12,16.2999153 C12,16.5760577 12.2238576,16.7999153 12.5,16.7999153 C12.7761424,16.7999153 13,16.5760577 13,16.2999153 L13,15.8999157 C13,15.6897448 12.9604525,15.4050232 12.8365336,15.1076389 C12.6082246,14.5597361 12.1585235,14.2000008 11.5,14.2000008 C10.8414765,14.2000008 10.3917754,14.5597361 10.1634664,15.1076389 C10.0395475,15.4050232 10,15.6897448 10,15.8999157 L10,16.2999153 C10,16.5760577 10.2238576,16.7999153 10.5,16.7999153 C10.7761424,16.7999153 11,16.5760577 11,16.2999153 L11,15.8999157 Z M20.5,17.5 C21.3284271,17.5 22,16.7164983 22,15.75 C22,14.7835017 21.3284271,14 20.5,14 C19.6715729,14 19,14.7835017 19,15.75 C19,16.7164983 19.6715729,17.5 20.5,17.5 Z M14.4246316,20.2360832 C14.4725953,20.313235 14.5938453,20.4556475 14.7863941,20.6025372 C15.1127054,20.8514701 15.512309,21.0000681 16,21.0000681 C16.487691,21.0000681 16.8872946,20.8514701 17.2136059,20.6025372 C17.4061547,20.4556475 17.5274047,20.313235 17.5753684,20.2360832 C17.7211632,20.0015657 18.0294673,19.9296417 18.2639848,20.0754365 C18.4985024,20.2212313 18.5704264,20.5295353 18.4246316,20.7640529 C18.3171754,20.9369012 18.1191505,21.1694886 17.8201344,21.3975989 C17.3271707,21.773666 16.7183393,22.0000681 16,22.0000681 C15.2816607,22.0000681 14.6728293,21.773666 14.1798656,21.3975989 C13.8808495,21.1694886 13.6828246,20.9369012 13.5753684,20.7640529 C13.4295736,20.5295353 13.5014976,20.2212313 13.7360152,20.0754365 C13.9705327,19.9296417 14.2788368,20.0015657 14.4246316,20.2360832 Z M8.50524139,0 L23.4947586,0 C24.3260808,0 25,0.664522048 25,1.50540179 L25,30.4945982 C25,31.3260091 24.3328704,32 23.4947586,32 L8.50524139,32 C7.67391922,32 7,31.335478 7,30.4945982 L7,1.50540179 C7,0.673990876 7.66712958,0 8.50524139,0 Z M8,27 L24,27 L24,5 L8,5 L8,27 Z M8,1.49616834 C8,1.22214184 8.21990656,1 8.49826729,1 L23.5017327,1 C23.7769177,1 24,1.22477121 24,1.49616834 L24,4 L8,4 L8,1.49616834 Z M8,30.503832 C8,30.775229 8.22308227,31 8.49826729,31 L23.5017327,31 C23.7800934,31 24,30.777858 24,30.503832 L24,28 L8,28 L8,30.503832 Z M15.4904785,2 L18.5095215,2 C18.7804054,2 19,2.23193359 19,2.5 C19,2.77614237 18.7849426,3 18.5095215,3 L15.4904785,3 C15.2195946,3 15,2.76806641 15,2.5 C15,2.22385763 15.2150574,2 15.4904785,2 Z M13.5,3 C13.7761424,3 14,2.77614237 14,2.5 C14,2.22385763 13.7761424,2 13.5,2 C13.2238576,2 13,2.22385763 13,2.5 C13,2.77614237 13.2238576,3 13.5,3 Z M16,30.5 C16.5522847,30.5 17,30.0522847 17,29.5 C17,28.9477153 16.5522847,28.5 16,28.5 C15.4477153,28.5 15,28.9477153 15,29.5 C15,30.0522847 15.4477153,30.5 16,30.5 Z" />
            </svg>
            <div className="text-3xl font-bold text-white font-poppins">SoBuddy</div>
          </div>
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

