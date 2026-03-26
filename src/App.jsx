import React, { useEffect, useMemo, useState } from 'react';

const initialHabits = [];

const pink = {
  background: '#F9EEF3',
  card: '#FFF7FA',
  soft: '#F5DDE7',
  primary: '#D88FA7',
  primaryDark: '#B96F88',
  text: '#6D4B57',
  muted: '#A67B8B',
  white: '#FFFFFF',
};

export default function App() {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : initialHabits;
  });

  const [newHabit, setNewHabit] = useState('');
  const [selectedTime, setSelectedTime] = useState('morgun');
  const [childName, setChildName] = useState(() => localStorage.getItem('childName') || 'Stjarnan mín');
  const [showCelebration, setShowCelebration] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [routineNotes, setRoutineNotes] = useState(() => {
    const saved = localStorage.getItem('routineNotes');
    return saved ? JSON.parse(saved) : { morgun: '', kvöld: '' };
  });

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('routineNotes', JSON.stringify(routineNotes));
  }, [routineNotes]);

  useEffect(() => {
    localStorage.setItem('childName', childName);
  }, [childName]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const completedCount = habits.filter((habit) => habit.done).length;
  const progress = habits.length ? Math.round((completedCount / habits.length) * 100) : 0;

  useEffect(() => {
    if (habits.length > 0 && completedCount === habits.length) {
      setShowCelebration(true);
      const timer = window.setTimeout(() => setShowCelebration(false), 4200);
      return () => window.clearTimeout(timer);
    }
  }, [completedCount, habits.length]);

  const morningHabits = useMemo(
    () => habits.filter((habit) => habit.time === 'morgun'),
    [habits]
  );

  const eveningHabits = useMemo(
    () => habits.filter((habit) => habit.time === 'kvöld'),
    [habits]
  );

  const toggleHabit = (id) => {
    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== id) return habit;
        const nextDone = !habit.done;
        return {
          ...habit,
          done: nextDone,
          streak: nextDone ? habit.streak + 1 : Math.max(habit.streak - 1, 0),
        };
      })
    );
  };

  const addHabit = () => {
    const title = newHabit.trim();
    if (!title) return;

    const icon = selectedTime === 'morgun' ? '🌤️' : '✨';

    setHabits((current) => [
      {
        id: Date.now().toString(),
        title,
        time: selectedTime,
        done: false,
        streak: 0,
        icon,
      },
      ...current,
    ]);

    setNewHabit('');
  };

  const removeHabit = (id) => {
    setHabits((current) => current.filter((habit) => habit.id !== id));
  };

  const updateRoutineNote = (time, text) => {
    setRoutineNotes((current) => ({
      ...current,
      [time]: text,
    }));
  };

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const rewardMessage =
    progress === 100
      ? 'Þú kláraðir allt í dag! 🌈'
      : progress >= 75
      ? 'Frábær vinna! Þú ert næstum búin 💖'
      : progress >= 40
      ? 'Vel gert! Haltu áfram ✨'
      : 'Byrjaðu á einu litlu skrefi 💗';

  const renderRewardStars = () => {
    const stars = Math.min(5, Math.max(1, Math.ceil(progress / 20) || 1));
    return '⭐'.repeat(stars);
  };

  const renderHabit = (habit) => (
    <div
      key={habit.id}
      style={{
        ...styles.habitCard,
        ...(habit.done ? styles.habitCardDone : {}),
      }}
    >
      <button
        type="button"
        onClick={() => toggleHabit(habit.id)}
        style={styles.habitMainButton}
      >
        <div style={styles.habitLeft}>
          <div style={styles.iconBubble}>
            <span style={styles.iconText}>{habit.icon}</span>
          </div>
          <div>
            <div style={styles.habitTitle}>{habit.title}</div>
            <div style={styles.habitSubtitle}>Samfella: {habit.streak} dagar</div>
          </div>
        </div>

        <div
          style={{
            ...styles.checkCircle,
            ...(habit.done ? styles.checkCircleDone : {}),
          }}
        >
          <span style={styles.checkText}>{habit.done ? '✓' : ''}</span>
        </div>
      </button>

      <button type="button" onClick={() => removeHabit(habit.id)} style={styles.deleteButton}>
        Eyða
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0.9; }
        }

        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={styles.page}>
        <div style={styles.wrapper}>
          <section style={styles.profileCard}>
            <div style={styles.profileTopRow}>
              <div>
                <div style={styles.profileLabel}>Lítil meistari dagsins</div>
                <h2 style={styles.profileTitle}>{childName || 'Stjarnan mín'}</h2>
              </div>
              <div style={styles.starBadge}>{renderRewardStars()}</div>
            </div>

            <div style={styles.profileControls}>
              <input
                style={styles.input}
                placeholder="Skráðu nafnið hennar"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />

              {deferredPrompt ? (
                <button type="button" style={styles.installButton} onClick={installApp}>
                  Setja upp sem app 📱
                </button>
              ) : null}
            </div>
          </section>

          <section style={styles.heroCard}>
            <div style={styles.eyebrow}>Rútína</div>
            <h1 style={styles.title}>Fallegi habit trackerinn þinn</h1>
            <p style={styles.subtitle}>
              Fylgstu með morgun- og kvöldrútínu á einfaldan og hlýjan hátt.
            </p>

            <div style={styles.progressRow}>
              <div style={styles.progressCircle}>
                <div style={styles.progressValue}>{progress}%</div>
                <div style={styles.progressLabel}>í dag</div>
              </div>

              <div style={styles.progressInfo}>
                <div style={styles.progressHeadline}>
                  {completedCount} af {habits.length} lokið
                </div>
                <div style={styles.progressText}>Lítil skref skipta máli 💗</div>
                <div style={styles.rewardPill}>{rewardMessage}</div>
              </div>
            </div>
          </section>

          <section style={styles.addCard}>
            <h2 style={styles.sectionTitle}>Bæta við vana</h2>

            <input
              style={styles.input}
              placeholder="Til dæmis: Lesa í 10 mínútur"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addHabit();
              }}
            />

            <div style={styles.segmentRow}>
              <button
                type="button"
                style={{
                  ...styles.segmentButton,
                  ...(selectedTime === 'morgun' ? styles.segmentButtonActive : {}),
                }}
                onClick={() => setSelectedTime('morgun')}
              >
                <span
                  style={{
                    ...styles.segmentText,
                    ...(selectedTime === 'morgun' ? styles.segmentTextActive : {}),
                  }}
                >
                  Morgun
                </span>
              </button>

              <button
                type="button"
                style={{
                  ...styles.segmentButton,
                  ...(selectedTime === 'kvöld' ? styles.segmentButtonActive : {}),
                }}
                onClick={() => setSelectedTime('kvöld')}
              >
                <span
                  style={{
                    ...styles.segmentText,
                    ...(selectedTime === 'kvöld' ? styles.segmentTextActive : {}),
                  }}
                >
                  Kvöld
                </span>
              </button>
            </div>

            <button type="button" style={styles.addButton} onClick={addHabit}>
              + Bæta við vana
            </button>
          </section>

          <section style={styles.sectionBlock}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>🌤️ Morgunrútína</h2>
              <div style={styles.countText}>{morningHabits.length} vanar</div>
            </div>

            <div style={styles.noteCard}>
              <div style={styles.noteTitle}>Skrifaðu þína morgunrútínu</div>
              <textarea
                style={styles.noteInput}
                placeholder="Til dæmis: Vakna, drekka vatn, gera húðumhirðu, lesa í 10 mínútur..."
                value={routineNotes.morgun}
                onChange={(e) => updateRoutineNote('morgun', e.target.value)}
              />
            </div>

            {morningHabits.map(renderHabit)}
          </section>

          <section style={styles.sectionBlock}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>🌙 Kvöldrútína</h2>
              <div style={styles.countText}>{eveningHabits.length} vanar</div>
            </div>

            <div style={styles.noteCard}>
              <div style={styles.noteTitle}>Skrifaðu þína kvöldrútínu</div>
              <textarea
                style={styles.noteInput}
                placeholder="Til dæmis: Slökkva á skjám, fara í sturtu, skrifa dagbók, fara snemma að sofa..."
                value={routineNotes.kvöld}
                onChange={(e) => updateRoutineNote('kvöld', e.target.value)}
              />
            </div>

            {eveningHabits.map(renderHabit)}
          </section>
        </div>

        {showCelebration ? (
          <div style={styles.celebrationOverlay}>
            <div style={styles.celebrationCard}>
              <div style={styles.confettiRow}>🎉 🎀 ✨ 🌈 ✨ 🎉</div>
              <div style={styles.celebrationTitle}>Vel gert, {childName || 'stjarna'}!</div>
              <div style={styles.celebrationText}>Allir vanar dagsins eru kláraðir.</div>
              <div style={styles.celebrationStars}>{renderRewardStars()}</div>
            </div>

            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                style={{
                  ...styles.confettiPiece,
                  left: `${5 + index * 5}%`,
                  animationDelay: `${(index % 6) * 0.15}s`,
                }}
              >
                {index % 3 === 0 ? '🎉' : index % 3 === 1 ? '✨' : '💖'}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: pink.background,
    padding: '24px 16px',
    fontFamily: 'Arial, sans-serif',
    color: pink.text,
  },
  wrapper: {
    position: 'relative',
    maxWidth: '860px',
    margin: '0 auto',
    display: 'grid',
    gap: '18px',
  },
  profileCard: {
    background: 'linear-gradient(135deg, #FFF7FA 0%, #FBEAF1 100%)',
    borderRadius: '28px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  },
  profileTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  profileLabel: {
    fontSize: '13px',
    color: pink.primaryDark,
    fontWeight: 700,
    marginBottom: '6px',
  },
  profileTitle: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 800,
    color: pink.text,
  },
  profileControls: {
    display: 'grid',
    gap: '12px',
    marginTop: '16px',
  },
  starBadge: {
    background: pink.white,
    color: pink.primaryDark,
    borderRadius: '999px',
    padding: '10px 14px',
    fontSize: '22px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
  },
  installButton: {
    width: '100%',
    background: '#F3C7D5',
    borderRadius: '18px',
    padding: '14px',
    color: pink.primaryDark,
    fontSize: '15px',
    fontWeight: 800,
    border: 'none',
    cursor: 'pointer',
  },
  heroCard: {
    background: pink.card,
    borderRadius: '28px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  },
  eyebrow: {
    fontSize: '14px',
    color: pink.primaryDark,
    marginBottom: '8px',
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: '28px',
    lineHeight: 1.2,
    color: pink.text,
    fontWeight: 800,
  },
  subtitle: {
    fontSize: '15px',
    lineHeight: 1.5,
    color: pink.muted,
    marginTop: '8px',
    marginBottom: 0,
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginTop: '20px',
    flexWrap: 'wrap',
  },
  progressCircle: {
    width: '98px',
    height: '98px',
    borderRadius: '999px',
    background: pink.soft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    flexShrink: 0,
  },
  progressValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: pink.primaryDark,
  },
  progressLabel: {
    fontSize: '13px',
    color: pink.muted,
    marginTop: '2px',
  },
  progressInfo: {
    flex: 1,
    minWidth: '220px',
  },
  progressHeadline: {
    fontSize: '18px',
    fontWeight: 700,
    color: pink.text,
    marginBottom: '6px',
  },
  progressText: {
    fontSize: '14px',
    color: pink.muted,
  },
  rewardPill: {
    display: 'inline-block',
    marginTop: '10px',
    background: '#F7D9E4',
    color: pink.primaryDark,
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 700,
  },
  addCard: {
    background: pink.card,
    borderRadius: '24px',
    padding: '18px',
  },
  sectionBlock: {
    display: 'grid',
    gap: '12px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 800,
    color: pink.text,
  },
  countText: {
    fontSize: '13px',
    color: pink.muted,
    fontWeight: 600,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: pink.white,
    borderRadius: '18px',
    padding: '14px 16px',
    marginTop: '14px',
    fontSize: '15px',
    color: pink.text,
    border: `1px solid ${pink.soft}`,
    outline: 'none',
  },
  segmentRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '14px',
  },
  segmentButton: {
    flex: 1,
    background: pink.soft,
    borderRadius: '16px',
    padding: '12px',
    border: 'none',
    cursor: 'pointer',
  },
  segmentButtonActive: {
    background: pink.primary,
  },
  segmentText: {
    color: pink.primaryDark,
    fontWeight: 700,
    fontSize: '15px',
  },
  segmentTextActive: {
    color: pink.white,
  },
  addButton: {
    width: '100%',
    background: pink.primaryDark,
    borderRadius: '18px',
    padding: '14px',
    marginTop: '14px',
    color: pink.white,
    fontSize: '15px',
    fontWeight: 800,
    border: 'none',
    cursor: 'pointer',
  },
  habitCard: {
    background: pink.card,
    borderRadius: '22px',
    padding: '16px',
    display: 'grid',
    gap: '12px',
  },
  habitCardDone: {
    background: '#FBEAF1',
  },
  habitMainButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
  },
  habitLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  iconBubble: {
    width: '48px',
    height: '48px',
    borderRadius: '999px',
    background: pink.soft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: '22px',
  },
  habitTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: pink.text,
  },
  habitSubtitle: {
    fontSize: '13px',
    color: pink.muted,
    marginTop: '4px',
  },
  checkCircle: {
    width: '30px',
    height: '30px',
    borderRadius: '999px',
    border: `2px solid ${pink.primary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '12px',
    flexShrink: 0,
  },
  checkCircleDone: {
    background: pink.primary,
  },
  checkText: {
    color: pink.white,
    fontWeight: 900,
    fontSize: '15px',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    background: pink.soft,
    padding: '8px 12px',
    borderRadius: '12px',
    border: 'none',
    color: pink.primaryDark,
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
  },
  noteCard: {
    background: pink.card,
    borderRadius: '20px',
    padding: '16px',
  },
  noteTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: pink.text,
    marginBottom: '10px',
  },
  noteInput: {
    width: '100%',
    minHeight: '110px',
    resize: 'vertical',
    boxSizing: 'border-box',
    background: pink.white,
    borderRadius: '16px',
    padding: '14px',
    fontSize: '15px',
    color: pink.text,
    lineHeight: 1.5,
    border: `1px solid ${pink.soft}`,
    outline: 'none',
    fontFamily: 'inherit',
  },
  celebrationOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(109, 75, 87, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 50,
    pointerEvents: 'none',
  },
  celebrationCard: {
    background: pink.white,
    borderRadius: '28px',
    padding: '24px',
    textAlign: 'center',
    boxShadow: '0 18px 40px rgba(0,0,0,0.12)',
    maxWidth: '320px',
    zIndex: 2,
    animation: 'popIn 0.35s ease-out',
  },
  confettiRow: {
    fontSize: '26px',
    marginBottom: '10px',
  },
  celebrationTitle: {
    fontSize: '24px',
    fontWeight: 800,
    color: pink.text,
  },
  celebrationText: {
    marginTop: '8px',
    fontSize: '15px',
    color: pink.muted,
  },
  celebrationStars: {
    marginTop: '14px',
    fontSize: '28px',
  },
  confettiPiece: {
    position: 'absolute',
    top: '-20px',
    fontSize: '24px',
    animation: 'fall 2.8s linear infinite',
  },
};
