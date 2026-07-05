import { motion } from 'framer-motion';
import type { ComponentType } from 'react';

type MotionComponentMap = {
  div: ComponentType<any>;
  main: ComponentType<any>;
  section: ComponentType<any>;
  button: ComponentType<any>;
};

export const Motion = motion as unknown as MotionComponentMap;