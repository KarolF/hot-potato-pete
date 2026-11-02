import { Card } from "../../model/interfaces";
import { CardView } from "./CardView";

export interface HandRenderOptions {
  faceUp: boolean;
  selectable: boolean;
  availableWidth: number;
  onCardClick?: (index: number) => void;
}

export interface HandTransitionOptions {
  instantCardIds?: string[];
}

export interface CardPose {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface CardHit {
  index: number;
  cardId: string;
}

export interface CardScanTarget {
  cardId: string;
  x: number;
  y: number;
}

export type HandOrientation = "player" | "opponent";

export interface CardLayout extends CardPose {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface OrderAnimationStep {
  views: CardView[];
  cards: Card[];
  layouts: CardLayout[];
}

export interface CardTweenPose {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
