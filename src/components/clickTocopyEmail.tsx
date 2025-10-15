import { Mail } from 'lucide-react';

export default function EmailCopy() {
  const handleCopy = () => {
    navigator.clipboard.writeText('tinnapat.jaimunt@gmail.com');
    alert('Email copied to clipboard!');
  };

  return (
    <div
      onClick={handleCopy}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
      }}
    >
      <Mail size={20} />
      <span style={{ fontSize: '0.875rem', userSelect: 'none' }}>
        Email: tinnapat.jaimunt@gmail.com
      </span>
    </div>
  );
}
