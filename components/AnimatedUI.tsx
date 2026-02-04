import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedPageProps {
    children: React.ReactNode;
    className?: string;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        filter: 'blur(10px)',
    },
    animate: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        filter: 'blur(10px)',
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className }) => {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const AnimatedCard: React.FC<AnimatedPageProps & {
    delay?: number;
    containerRef?: (el: HTMLDivElement | null) => void;
    onClick?: () => void;
    'data-testid'?: string;
}> = ({
    children,
    className,
    delay = 0,
    containerRef,
    onClick,
    'data-testid': testId
}) => {
        return (
            <motion.div
                ref={containerRef}
                onClick={onClick}
                data-testid={testId}
                initial={{ opacity: 0, y: 30 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                        delay,
                        duration: 0.5,
                        ease: [0.34, 1.56, 0.64, 1]
                    }
                }}
                whileHover={{
                    scale: 1.02,
                    y: -5,
                    transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
                className={`premium-2026-card ${className || ''}`}
            >
                {children}
            </motion.div>
        );
    };
