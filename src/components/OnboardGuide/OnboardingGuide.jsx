import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, X, Sparkles, TrendingUp, BarChart2, SkipForward, Map } from 'lucide-react';
import './OnboardingGuide.css';
import paciSharkImg from '../../assets/paci-shark.png';

const GUIDE_STEPS = [
    {
        title: "Welcome to OceanX!",
        text: "Hey there! I'm Paci 🦈, the OceanX mascot and professional trader. I'll quickly show you how to navigate the site and find the best trades. Onward to the treasure! ⚓️💰",
        icon: <Sparkles size={28} className="step-icon text-teal" />,
        targetId: null,
    },
    {
        title: "Market Stats",
        text: "Here you'll find full market statistics. Volumes, liquidations, and open interest update in real-time. This will help you understand market depth, spot broad trends across top markets, and make informed decisions.",
        icon: <BarChart2 size={28} className="step-icon text-purple" />,
        targetId: "step-market-stats", // ID элемента, к которому прилипнет гайд
    },
    {
        title: "Copy Trading",
        text: "Don't want to spend all day staring at charts? In this section, you can choose top traders with proven track records and automatically copy their trades. It’s the perfect way to earn passive income and learn from the pros while the system works for you. (Under development)",
        icon: <TrendingUp size={28} className="step-icon text-blue" />,
        targetId: "step-copy-trading", // ID ссылки в меню
    },
    {
        title: "Heatmaps",
        text: "Heatmaps are your market X-ray. They reveal exactly where big players are placing their limit orders (liquidity). Use this tool to identify strong support and resistance levels and trade alongside the whales, not against them!",
        icon: <Map size={28} className="step-icon text-orange" />,
        targetId: "step-heatmaps", // ID ссылки в меню
    }
];

export default function OnboardingGuide() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [cardStyle, setCardStyle] = useState({});

    // Открытие гайда
    useEffect(() => {
        const hasSeenGuide = localStorage.getItem('pacifica_guide_seen');
        if (!hasSeenGuide) {
            setTimeout(() => setIsOpen(true), 1000);
        }

        const handleOpenGuide = () => {
            console.log("🔥 ИВЕНТ ПОЙМАН! Открываем гайд..."); // <--- ДОБАВЬ ЭТО
            setCurrentStep(0);
            setIsOpen(true);
        };
        window.addEventListener('open-guide', handleOpenGuide);
        return () => window.removeEventListener('open-guide', handleOpenGuide);
    }, []);

    // Расчет позиции карточки относительно элемента
    useEffect(() => {
        if (!isOpen) return;

        const step = GUIDE_STEPS[currentStep];

        // Убираем подсветку со всех прошлых элементов
        document.querySelectorAll('.guide-highlight-target').forEach(el => {
            el.classList.remove('guide-highlight-target');
        });

        if (step.targetId) {
            const el = document.getElementById(step.targetId);
            if (el) {
                // Подсвечиваем целевой элемент
                el.classList.add('guide-highlight-target');

                // Вычисляем координаты
                const rect = el.getBoundingClientRect();

                // Центр кнопки, на которую нужно указать
                const targetCenter = rect.left + rect.width / 2;

                // Ширина плашки (около 800px, но берем с запасом для мобилок)
                const modalWidth = window.innerWidth > 800 ? 800 : window.innerWidth - 40;

                // Идеальная позиция плашки (по центру), но не даем ей уехать за края экрана
                let modalLeft = targetCenter - modalWidth / 2;
                const minMargin = 20;

                if (modalLeft < minMargin) modalLeft = minMargin;
                if (modalLeft + modalWidth > window.innerWidth - minMargin) {
                    modalLeft = window.innerWidth - modalWidth - minMargin;
                }

                // 🔥 УМНАЯ СТРЕЛОЧКА: Считаем, где она должна быть относительно плашки
                const arrowLeft = targetCenter - modalLeft;

                setCardStyle({
                    top: `${rect.bottom + 20}px`,
                    left: `${modalLeft}px`,
                    position: 'fixed',
                    transform: 'none',
                    '--arrow-left': `${arrowLeft}px` // Передаем координату в CSS!
                });
                return;
            }
        }

        // Если нет ID — ставим по центру
        setCardStyle({
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'fixed',
            '--arrow-left': '50%'
        });

    }, [currentStep, isOpen]);

    const handleNext = () => {
        if (currentStep < GUIDE_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            closeGuide();
        }
    };

    const closeGuide = () => {
        document.querySelectorAll('.guide-highlight-target').forEach(el => {
            el.classList.remove('guide-highlight-target');
        });
        localStorage.setItem('pacifica_guide_seen', 'true');
        setIsOpen(false);
    };

    if (!isOpen) return null;

    const stepData = GUIDE_STEPS[currentStep];
    const isLastStep = currentStep === GUIDE_STEPS.length - 1;

    return (
        <div className="guide-overlay">
            {/* Карточка гайда (применяем стили позиции) */}
            <div className="guide-glass-modal" style={cardStyle}>

                {/* Стрелочка, указывающая вверх (показывается только если есть цель) */}
                {stepData.targetId && <div className="guide-arrow-up"></div>}

                <div className="guide-content-wrapper">
                    {/* Маскот */}
                    <div className="mascot-container">
                        <img
                            src={paciSharkImg}
                            alt="Paci Shark"
                            className="mascot-avatar-img"
                        />
                        <div className="mascot-name">Paci</div>
                    </div>

                    {/* Текст */}
                    <div className="guide-text-area">
                        <div className="guide-header">
                            {stepData.icon}
                            <h2 className="guide-title">{stepData.title}</h2>
                        </div>
                        <p className="guide-description">{stepData.text}</p>

                        {currentStep === 0 && (
                            <a
                                href="https://x.com/OceanXPaci"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-x-follow"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Follow Us on X
                            </a>
                        )}

                        {/* Кнопки и прогресс */}
                        <div className="guide-actions">
                            <button className="guide-skip-btn" onClick={closeGuide}>
                                Skip <SkipForward size={14} />
                            </button>

                            <div className="step-dots">
                                {GUIDE_STEPS.map((_, idx) => (
                                    <span key={idx} className={`dot ${idx === currentStep ? 'active' : ''}`} />
                                ))}
                            </div>

                            <button className="guide-next-btn" onClick={handleNext}>
                                {isLastStep ? "Let's Go!" : "Next"}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}