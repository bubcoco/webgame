'use client';

import React, { useState, useEffect } from 'react';
import { Github, Linkedin, Mail, Gamepad2, Code, Sparkles, ArrowRight, Rocket, Database, Cloud, Server } from 'lucide-react';
import EmailCopy from '@/components/clickTocopyEmail';
import ConnectWallet from '@/components/connectWallet';

const HomePage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: any) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const skillCategories = [
    {
      title: 'Languages',
      icon: <Code className="w-5 h-5" />,
      skills: ['Python', 'JavaScript', 'TypeScript', 'Java', 'Rust', 'Solidity', 'Bash']
    },
    {
      title: 'Frontend',
      icon: <Sparkles className="w-5 h-5" />,
      skills: ['React', 'Next.js', 'React Native', 'Svelte', 'Tailwind CSS', 'HTML5', 'CSS3']
    },
    {
      title: 'Backend',
      icon: <Server className="w-5 h-5" />,
      skills: ['Node.js', 'Express.js', 'NestJS', 'Django', 'Flask', 'Spring', 'GraphQL']
    },
    {
      title: 'Databases',
      icon: <Database className="w-5 h-5" />,
      skills: ['PostgreSQL', 'MongoDB', 'MySQL']
    },
    {
      title: 'DevOps & Cloud',
      icon: <Cloud className="w-5 h-5" />,
      skills: ['Docker', 'Git', 'Jenkins', 'Grafana', 'Linux', 'GCP', 'Firebase']
    },
    {
      title: 'Blockchain',
      icon: <Rocket className="w-5 h-5" />,
      skills: ['Solidity', 'Hardhat', 'Ethers.js', 'Hyperledger Besu', 'Hyperledger Besu (with customize stateful precompile)',
        'Blockscout'
      ]
    }
  ];

  const currentlyLearning = ['Rust', 'Kafka', 'RabbitMQ', 'DevOps Tools'];

  return (
    <div style={{
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #111827)',
      minHeight: '100vh',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background gradient orbs */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '384px',
            height: '384px',
            background: '#06b6d4',
            borderRadius: '50%',
            mixBlendMode: 'multiply',
            filter: 'blur(64px)',
            opacity: 0.1,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '25%',
            width: '384px',
            height: '384px',
            background: '#a855f7',
            borderRadius: '50%',
            mixBlendMode: 'multiply',
            filter: 'blur(64px)',
            opacity: 0.1,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: '1s',
            transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`
          }}
        />
      </div>

      <main style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Header Section */}
        <header style={{
          textAlign: 'center',
          marginBottom: '4rem',
          transition: 'all 1s',
          transform: isVisible ? 'translateY(0)' : 'translateY(2.5rem)',
          opacity: isVisible ? 1 : 0
        }}>
          <div style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, #06b6d4, #a855f7)',
              borderRadius: '50%',
              filter: 'blur(16px)',
              opacity: 0.5,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} />
            <img
              src="https://placehold.co/150x150/000000/FFFFFF?text=BT"
              alt="Bub Tinnapat"
              style={{
                position: 'relative',
                width: '176px',
                height: '176px',
                borderRadius: '50%',
                border: '4px solid #22d3ee',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '-8px',
              right: '-8px',
              background: 'linear-gradient(to right, #06b6d4, #a855f7)',
              borderRadius: '50%',
              padding: '8px'
            }}>
              <Sparkles style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
          </div>

          <h1 style={{
            fontSize: '3.75rem',
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #22d3ee, #c084fc, #f9a8d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.75rem'
          }}>
            Bub Tinnapat
          </h1>
          <p style={{ fontSize: '1.5rem', color: '#d1d5db', marginBottom: '0.5rem' }}>
            Software Developer
          </p>
          <p style={{
            color: '#22d3ee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Code style={{ width: '16px', height: '16px' }} />
            Crafting Digital Experiences
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
            🇹🇭 Thailand • Exploring distributed systems & DevOps
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.5rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <a
              href="https://github.com/bubcoco"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#1f2937',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                transition: 'all 0.3s',
                textDecoration: 'none',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#374151';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1f2937';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Github size={20} />
              <span style={{ fontSize: '0.875rem' }}>GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/bubblexyz/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#1f2937',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                transition: 'all 0.3s',
                textDecoration: 'none',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#374151';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1f2937';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Linkedin size={20} />
              <span style={{ fontSize: '0.875rem' }}>LinkedIn</span>
            </a>
            <a
              // href="mailto:tinnapat.jaimunt@gmail.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#1f2937',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                transition: 'all 0.3s',
                textDecoration: 'none',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#374151';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1f2937';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* <Mail size={20} />
              <span style={{ fontSize: '0.875rem'}}>Email :tinnapat.jaimunt@gmail.com</span> */}
              <EmailCopy />
            </a>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <ConnectWallet />
          </div>
        </header>

        {/* About Me Section */}
        <section style={{
          background: 'rgba(31, 41, 55, 0.5)',
          backdropFilter: 'blur(8px)',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          marginBottom: '3rem',
          border: '1px solid rgba(75, 85, 99, 0.5)',
          transition: 'all 1s',
          transitionDelay: '0.2s',
          transform: isVisible ? 'translateY(0)' : 'translateY(2.5rem)',
          opacity: isVisible ? 1 : 0
        }}>
          <h2 style={{
            fontSize: '2.25rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #22d3ee, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            About Me
          </h2>
          <p style={{
            color: '#d1d5db',
            lineHeight: '1.75',
            fontSize: '1.125rem',
            marginBottom: '1.5rem'
          }}>
            I'm a passionate developer from Thailand who loves building scalable applications and exploring new technologies.
            With a strong foundation in modern web technologies and a keen eye for design, I specialize in bringing ideas to life,
            from sleek websites to fun, browser-based games. Currently diving deep into distributed systems and DevOps practices.
          </p>

          {/* Currently Learning */}
          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginTop: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <Rocket style={{ width: '20px', height: '20px', color: '#22d3ee' }} />
              <span style={{ color: '#22d3ee', fontWeight: '600' }}>Currently Learning</span>
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {currentlyLearning.map((item, index) => (
                <span
                  key={index}
                  style={{
                    background: 'rgba(6, 182, 212, 0.2)',
                    color: '#67e8f9',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section style={{
          background: 'rgba(31, 41, 55, 0.5)',
          backdropFilter: 'blur(8px)',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          marginBottom: '3rem',
          border: '1px solid rgba(75, 85, 99, 0.5)',
          transition: 'all 1s',
          transitionDelay: '0.3s',
          transform: isVisible ? 'translateY(0)' : 'translateY(2.5rem)',
          opacity: isVisible ? 1 : 0
        }}>
          <h2 style={{
            fontSize: '2.25rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #22d3ee, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Tech Stack
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {skillCategories.map((category, catIndex) => (
              <div
                key={catIndex}
                style={{
                  background: 'rgba(55, 65, 81, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  color: '#22d3ee'
                }}>
                  {category.icon}
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {category.title}
                  </h3>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {category.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      style={{
                        background: 'rgba(31, 41, 55, 0.8)',
                        color: '#d1d5db',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        border: '1px solid rgba(75, 85, 99, 0.5)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)';
                        e.currentTarget.style.color = '#22d3ee';
                        e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(31, 41, 55, 0.8)';
                        e.currentTarget.style.color = '#d1d5db';
                        e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects Section */}
        <section style={{
          background: 'rgba(31, 41, 55, 0.5)',
          backdropFilter: 'blur(8px)',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          marginBottom: '3rem',
          border: '1px solid rgba(75, 85, 99, 0.5)',
          transition: 'all 1s',
          transitionDelay: '0.4s',
          transform: isVisible ? 'translateY(0)' : 'translateY(2.5rem)',
          opacity: isVisible ? 1 : 0
        }}>
          <h2 style={{
            fontSize: '2.25rem',
            fontWeight: 'bold',
            marginBottom: '2rem',
            background: 'linear-gradient(to right, #22d3ee, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Featured Projects
          </h2>

          {/* Projects Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Super Jump Quest */}
            <div style={{
              background: 'linear-gradient(to bottom right, rgba(55, 65, 81, 0.5), rgba(31, 41, 55, 0.5))',
              backdropFilter: 'blur(8px)',
              padding: '1.5rem',
              borderRadius: '1rem',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.5)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <span style={{ fontSize: '2rem' }}>🎮</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22d3ee' }}>
                  Super Jump Quest
                </h3>
              </div>
              <p style={{ color: '#9ca3af', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
                Retro platformer with animations, enemy AI, coins, and dynamic camera. EVM rewards!
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>Next.js</span>
                <span style={{ background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>EVM</span>
              </div>
              <a href="/game" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(to right, #06b6d4, #a855f7)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                <Gamepad2 style={{ width: '16px', height: '16px' }} />
                Play Game
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </a>
            </div>

            {/* Racing 3D */}
            <div style={{
              background: 'linear-gradient(to bottom right, rgba(55, 65, 81, 0.5), rgba(31, 41, 55, 0.5))',
              backdropFilter: 'blur(8px)',
              padding: '1.5rem',
              borderRadius: '1rem',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(231, 76, 60, 0.5)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <span style={{ fontSize: '2rem' }}>🏎️</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f39c12' }}>
                  Racing 3D
                </h3>
              </div>
              <p style={{ color: '#9ca3af', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
                Pseudo-3D racing with lane switching, obstacles, coin collection, and speed boost!
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>Canvas</span>
                <span style={{ background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>EVM</span>
              </div>
              <a href="/racing" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(to right, #f39c12, #e74c3c)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                <Gamepad2 style={{ width: '16px', height: '16px' }} />
                Play Racing
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </a>
            </div>

            {/* Rocket Launcher */}
            <div style={{
              background: 'linear-gradient(to bottom right, rgba(55, 65, 81, 0.5), rgba(31, 41, 55, 0.5))',
              backdropFilter: 'blur(8px)',
              padding: '1.5rem',
              borderRadius: '1rem',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <span style={{ fontSize: '2rem' }}>🚀</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22c55e' }}>
                  Rocket Launcher
                </h3>
              </div>
              <p style={{ color: '#9ca3af', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
                Token launchpad with bonding curves, trading simulation, and Phantom wallet!
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ background: 'rgba(20, 241, 149, 0.2)', color: '#14F195', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>Solana</span>
                <span style={{ background: 'rgba(153, 69, 255, 0.2)', color: '#9945FF', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>DeFi</span>
              </div>
              <a href="/pump" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(to right, #9945FF, #14F195)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                <Rocket style={{ width: '16px', height: '16px' }} />
                Launch Tokens
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </a>
            </div>

            {/* Sonic Rush */}
            <div style={{
              background: 'linear-gradient(to bottom right, rgba(55, 65, 81, 0.5), rgba(31, 41, 55, 0.5))',
              backdropFilter: 'blur(8px)',
              padding: '1.5rem',
              borderRadius: '1rem',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(21, 101, 192, 0.5)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <span style={{ fontSize: '2rem' }}>⚡</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1565C0' }}>
                  Sonic Rush
                </h3>
              </div>
              <p style={{ color: '#9ca3af', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
                Fast platformer with rings, speed boosts, rolling attacks. Dual EVM + Solana wallets!
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>EVM</span>
                <span style={{ background: 'rgba(20, 241, 149, 0.2)', color: '#14F195', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>Solana</span>
              </div>
              <a href="/sonic" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(to right, #1565C0, #42A5F5)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                <Gamepad2 style={{ width: '16px', height: '16px' }} />
                Play Sonic
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          marginTop: '4rem',
          paddingBottom: '2rem',
          color: '#6b7280'
        }}>
          <div style={{
            width: '64px',
            height: '4px',
            background: 'linear-gradient(to right, #06b6d4, #a855f7)',
            margin: '0 auto 1rem',
            borderRadius: '9999px'
          }} />
          <p style={{ fontSize: '0.875rem' }}>&copy; 2025 Bub Tinnapat. All rights reserved.</p>
        </footer>

      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;