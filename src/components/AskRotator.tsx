'use client';

import { useEffect, useState } from 'react';

interface Props {
  questions: string[];
}

// The questions behind the projects, one at a time. The full list is always available to screen
// readers, and with reduced motion the first question simply stays put.
export default function AskRotator({ questions }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (questions.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % questions.length), 4200);
    return () => clearInterval(timer);
  }, [questions.length]);

  return (
    <div className="asks">
      <p className="asks-label">The questions behind the work</p>
      <ul className="sr-only">
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
      <p className="asks-now" aria-hidden="true" key={index}>
        {questions[index]}
      </p>
    </div>
  );
}
