import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, SkipForward, Sparkles, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { createPortal } from 'react-dom';
import './GuideCopyTrading.css';
import paciSharkImg from '../../assets/copytrading.png';

const COPY_STEPS = [
    {
        title: "Copy Trading Hub",
        text: "Hey! 🦈 Welcome to the control center. First things first: connect your wallet to sync your balance and prepare for action!",
        icon: <Sparkles size={28} className="cg-text-teal" />,
        targetId: "step-wallet",
    },
    {
        title: "Elite Traders",
        text: "On the left, you'll find the Pacifica whales. Sort them by ROI, click to inspect their live positions, and follow the smart money! 📈",
        icon: <TrendingUp size={28} className="cg-text-blue" />,
        targetId: "step-traders",
        preferPosition: 'right',
    },
    {
        title: "Risk Control",
        text: "Safety first! Set your margin, max leverage, and pick your favorite pairs. Once you're done, hit SAVE to lock in your strategy. ⚙️",
        icon: <ShieldCheck size={28} className="cg-text-purple" />,
        targetId: "step-settings",
        preferPosition: 'left',
    },
    {
        title: "Live Positions",
        text: "Your active trades will appear here. Track your PnL in real-time and enjoy the ride. Good luck, Captain! 🌊",
        icon: <Zap size={28} className="cg-text-teal" />,
        targetId: "step-positions",
        preferPosition: 'bottom',
    }
];

const MODAL_H = 400;
const GAP = 24;

function calcPosition(step) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const positionType = step.preferPosition || 'bottom';

    const modalWidth = Math.min(700, vw - 40);
    const el = document.getElementById(step.targetId);

    if (!el) {
        return {
            style: {
                top: `${vh / 2 - MODAL_H / 2}px`,
                left: `${vw / 2 - modalWidth / 2}px`,
                transform: 'none',
                width: `${modalWidth}px`,
                '--arrow-left': '-9999px',
                '--arrow-top': '-9999px',
            },
            arrowClass: 'arrow-hidden',
        };
    }

    const rect = el.getBoundingClientRect();
    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;

    let top, left, arrowClass;
    let arrowLeft = modalWidth / 2;
    let arrowTop = MODAL_H / 2;

    if (positionType === 'left') {
        left = rect.left - modalWidth - GAP;
        if (left < 16) left = 16;
        top = targetCenterY - MODAL_H / 2;
        top = Math.max(16, Math.min(top, vh - MODAL_H - 16));
        arrowClass = 'arrow-right';
        arrowTop = targetCenterY - top;

    } else if (positionType === 'right') {
        left = rect.right + GAP;
        if (left + modalWidth > vw - 16) left = vw - modalWidth - 16;
        top = targetCenterY - MODAL_H / 2;
        top = Math.max(16, Math.min(top, vh - MODAL_H - 16));
        arrowClass = 'arrow-left';
        arrowTop = targetCenterY - top;

    } else {
        left = targetCenterX - modalWidth / 2;
        left = Math.max(16, Math.min(left, vw - modalWidth - 16));

        top = rect.bottom + GAP;

        if (top + MODAL_H > vh - 16) {
            top = rect.top - MODAL_H - GAP;
            arrowClass = 'arrow-down';
        } else {
            arrowClass = 'arrow-up';
        }

        top = Math.max(16, Math.min(top, vh - MODAL_H - 16));
        arrowLeft = targetCenterX - left;
    }

    arrowLeft = Math.max(30, Math.min(arrowLeft, modalWidth - 30));
    arrowTop = Math.max(30, Math.min(arrowTop, MODAL_H - 30));

    return {
        style: {
            top: `${top}px`,
            left: `${left}px`,
            transform: 'none',
            width: `${modalWidth}px`,
            '--arrow-left': `${arrowLeft}px`,
            '--arrow-top': `${arrowTop}px`,
        },
        arrowClass,
    };
}

export default function GuideCopyTrading() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [cardStyle, setCardStyle] = useState({});
    const [arrowClass, setArrowClass] = useState('arrow-hidden');

    useEffect(() => {
        const hasSeen = localStorage.getItem('copy_guide_seen');
        if (!hasSeen) setTimeout(() => setIsOpen(true), 1500);
        const handleForceOpen = () => { setCurrentStep(0); setIsOpen(true); };
        window.addEventListener('open-copy-guide', handleForceOpen);
        return () => window.removeEventListener('open-copy-guide', handleForceOpen);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        document.querySelectorAll('.cg-highlight-target')
            .forEach(el => el.classList.remove('cg-highlight-target'));

        const step = COPY_STEPS[currentStep];
        const { style, arrowClass: newArrowClass } = calcPosition(step);

        setCardStyle(style);
        setArrowClass(newArrowClass);

        const el = document.getElementById(step.targetId);
        if (el) el.classList.add('cg-highlight-target');
    }, [currentStep, isOpen]);

    const handleNext = () => {
        if (currentStep < COPY_STEPS.length - 1) setCurrentStep(p => p + 1);
        else closeGuide();
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(p => p - 1);
    };

    const closeGuide = () => {
        localStorage.setItem('copy_guide_seen', 'true');
        setIsOpen(false);
        document.querySelectorAll('.cg-highlight-target')
            .forEach(el => el.classList.remove('cg-highlight-target'));
    };

    if (!isOpen) return null;
    const stepData = COPY_STEPS[currentStep];

    return createPortal(
        <>
            <div className="cg-overlay" />

            <div className="cg-modal" style={cardStyle}>
                <div className={`cg-arrow-base ${arrowClass}`} />

                <div className="cg-content-wrapper">
                    <div className="cg-mascot-container">
                        <img src={paciSharkImg} alt="Paci" className="cg-mascot-img" />
                        <div className="cg-mascot-name">PACI</div>
                    </div>

                    <div className="cg-text-area">
                        <div className="cg-header">
                            {stepData.icon}
                            <h2 className="cg-title">{stepData.title}</h2>
                        </div>
                        <p className="cg-description">{stepData.text}</p>

                        <div className="cg-actions">
                            {currentStep > 0 ? (
                                <button className="cg-skip-btn" onClick={handlePrev}>
                                    <ChevronLeft size={16} style={{ marginRight: '4px' }} /> Back
                                </button>
                            ) : (
                                <button className="cg-skip-btn" onClick={closeGuide}>
                                    Skip <SkipForward size={14} style={{ marginLeft: '4px' }} />
                                </button>
                            )}

                            <div className="cg-dots">
                                {COPY_STEPS.map((_, idx) => (
                                    <span key={idx} className={`cg-dot${idx === currentStep ? ' active' : ''}`} />
                                ))}
                            </div>

                            <button className="cg-next-btn" onClick={handleNext}>
                                {currentStep === COPY_STEPS.length - 1 ? 'Start Trading' : 'Next'}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}