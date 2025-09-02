import React from 'react';
import { Github, Linkedin, Mail, Gamepad2 } from 'lucide-react';
import './globals.css';
import ConnectWallet from '@/components/connectWallet';

const HomePage = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <main className="max-w-4xl mx-auto p-8">

        {/* --- Header Section --- */}
        <header className="text-center mb-12 flex flex-col items-center">
          <img
            src="https://placehold.co/150x150/000000/FFFFFF?text=JD"
            alt="Bub Tinnapat"
            className="w-40 h-40 rounded-full mb-4 border-4 border-cyan-500 shadow-lg"
          />
          <h1 className="text-5xl font-bold text-white tracking-wider">Bub Tinnapat</h1>
          <p className="text-xl text-cyan-400 mt-2">Software Developer</p>
          <div className="flex justify-center space-x-6 mt-6">
            <a href="https://github.com/bubcoco" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"><Github size={28} /></a>
            <a href="https://www.linkedin.com/in/bubblexyz/" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"><Linkedin size={28} /></a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"><Mail size={28} />bulletflip22@gmail.com</a>
          </div>
          <ConnectWallet />
        </header>

        {/* --- About Me Section --- */}
        <section id="about" className="bg-gray-800 p-8 rounded-lg shadow-lg mb-12">
          <h2 className="text-3xl font-bold mb-4 border-b-2 border-cyan-500 pb-2">About Me</h2>
          <p className="text-gray-300 leading-relaxed">
            I'm a passionate developer with a love for creating interactive and engaging digital experiences.
            With a strong foundation in modern web technologies and a keen eye for design, I specialize in bringing ideas to life,
            from sleek websites to fun, browser-based games. I'm always eager to learn new things and take on exciting challenges.
          </p>
        </section>

        {/* --- Skills Section --- */}
        <section id="skills" className="bg-gray-800 p-8 rounded-lg shadow-lg mb-12">
          <h2 className="text-3xl font-bold mb-4 border-b-2 border-cyan-500 pb-2">Skills</h2>
          <div className="flex flex-wrap gap-4">
            <span className="bg-gray-700 text-cyan-400 py-2 px-4 rounded-full text-lg">Next.js</span>
            <span className="bg-gray-700 text-cyan-400 py-2 px-4 rounded-full text-lg">React</span>
            <span className="bg-gray-700 text-cyan-400 py-2 px-4 rounded-full text-lg">TypeScript</span>
            <span className="bg-gray-700 text-cyan-400 py-2 px-4 rounded-full text-lg">HTML5 Canvas</span>
            <span className="bg-gray-700 text-cyan-400 py-2 px-4 rounded-full text-lg">Tailwind CSS</span>
            <span className="bg-gray-700 text-cyan-400 py-2 px-4 rounded-full text-lg">Node.js</span>
          </div>
        </section>

        {/* --- Projects Section --- */}
        <section id="projects" className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-6 border-b-2 border-cyan-500 pb-2">Projects</h2>
          <div className="bg-gray-700 p-6 rounded-lg transform hover:scale-105 transition-transform duration-300">
            <h3 className="text-2xl font-bold text-cyan-400 mb-3">Super Jump Quest</h3>
            <p className="text-gray-300 mb-6">
              A retro-style platformer game built with Next.js and HTML5 Canvas. Features player animations, basic enemy AI, coin collection, and a dynamic camera system.
            </p>
            <a href="/game" className="inline-flex items-center bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 transition-colors duration-300 shadow-lg text-lg">
                <Gamepad2 className="mr-3" />
                Play Game
            </a>
          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="text-center mt-12 text-gray-500">
          <p>&copy; 2025 Bub Tinnapat. All rights reserved.</p>
        </footer>

      </main>
    </div>
  );
};

export default HomePage;
