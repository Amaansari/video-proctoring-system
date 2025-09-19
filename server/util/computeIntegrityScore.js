const computeIntegrityScore = (events) => {
  let score = 100;
  const deductions = [];

  events.forEach(e => {
    switch(e.type) {
      case "LOOKING_AWAY":
        score -= 2;
        deductions.push({ type: e.type, value: -2, time: e.startTime });
        break;
      case "NO_FACE":
        score -= 5;
        deductions.push({ type: e.type, value: -5, time: e.startTime });
        break;
      case "MULTIPLE_FACES":
        score -= 10;
        deductions.push({ type: e.type, value: -10, time: e.startTime });
        break;
      case "PHONE_DETECTED":
        score -= 15;
        deductions.push({ type: e.type, value: -15, time: e.startTime });
        break;
      case "BOOK_DETECTED":
        score -= 8;
        deductions.push({ type: e.type, value: -8, time: e.startTime });
        break;
    }
  });

  return { finalScore: Math.max(score, 0), deductions };
}

module.exports = { computeIntegrityScore };