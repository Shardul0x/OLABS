'use client';

import { useState, useEffect, type FC } from 'react';
import { motion } from 'motion/react';
import { IoMoon, IoMoonOutline, IoSunny, IoSunnyOutline } from 'react-icons/io5';
import { useTheme } from '@/contexts/ThemeContext';

interface SwitchModeProps {
  width?: number;
  height?: number;
  darkColor?: string;
  lightColor?: string;
  knobDarkColor?: string;
  knobLightColor?: string;
  borderDarkColor?: string;
  borderLightColor?: string;
}

export const SwitchMode: FC<SwitchModeProps> = ({
  width = 144,
  height = 72,
  darkColor = '#0B0B0B',
  lightColor = '#FFFFFF',
  knobDarkColor = '#2A2A2E',
  knobLightColor = '#F3F2F7',
  borderDarkColor = '#4C4C50',
  borderLightColor = '#D8D6E0',
}) => {
  const [mounted, setMounted] = useState(false);
  const { dark, toggle } = useTheme();

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  if (!mounted) {
    return <div style={{ width, height }} className="rounded-full border-2 border-transparent" />;
  }

  const iconSize = height * 0.45;

  return (
    <motion.button
      onClick={toggle}
      className="relative flex items-center rounded-full border-2 transition-colors"
      style={{
        width,
        height,
        borderColor: dark ? borderDarkColor : borderLightColor,
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ backgroundColor: dark ? darkColor : lightColor }}
        transition={{ duration: 0.4 }}
      />

      <motion.div
        layout
        layoutId="switch-knob"
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="absolute rounded-full border-2 z-30"
        style={{
          width: height,
          height,
          right: dark ? -2 : undefined,
          left: dark ? undefined : -2,
          backgroundColor: dark ? knobDarkColor : knobLightColor,
          borderColor: dark ? borderDarkColor : borderLightColor,
        }}
      />

      <motion.div
        className="relative z-30 flex items-center justify-center"
        style={{ width: height, height }}
        animate={{ rotate: dark ? 45 : 0 }}
        transition={{ stiffness: 20 }}
      >
        {dark ? (
          <IoSunnyOutline
            color="#8A8A8F"
            style={{ width: iconSize, height: iconSize }}
            className="transition-colors duration-200"
          />
        ) : (
          <IoSunny
            color="#686771"
            style={{ width: iconSize, height: iconSize }}
            className="transition-colors duration-200"
          />
        )}
      </motion.div>

      <motion.div
        className="relative z-30 flex items-center justify-center"
        style={{ width: height, height }}
        animate={{ rotate: dark ? 0 : 15 }}
        transition={{ stiffness: 20, damping: 14 }}
      >
        {dark ? (
          <IoMoon
            color="#F4F4FB"
            style={{ width: iconSize, height: iconSize }}
            className="transition-colors duration-200"
          />
        ) : (
          <IoMoonOutline
            color="#ABABB4"
            style={{ width: iconSize, height: iconSize }}
            className="transition-colors duration-200"
          />
        )}
      </motion.div>
    </motion.button>
  );
};
