// Update the import path to the correct relative path
import SuperJumpQuest from '../components/SuperJumpQuest';

export default function HomePage() {
  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <main>
        <SuperJumpQuest />
      </main>
    </>
  );
}