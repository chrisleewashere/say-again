/**
 * The Field Case itself — original 1960s-70s analog spycraft briefcase built
 * entirely from primitives (no external assets). Geometry only; module
 * faceplates mount via <Faceplate> at slots from layout.ts.
 */
import { Html, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as React from 'react';
import type * as THREE from 'three';
import {
  BRASS,
  CASE_ALUMINUM,
  CASE_ALUMINUM_WORN,
  CASE_INTERIOR,
  LAMP_OFF,
  LAMP_RED,
  SCREW_BRASS,
  SCREW_STEEL,
} from './materials';
import { CASE_D, CASE_H, CASE_W, LID_H, LID_OPEN_ANGLE } from './layout';

function Latch({ x }: { x: number }) {
  return (
    <group position={[x, CASE_H - 0.08, CASE_D / 2 + 0.03]}>
      <RoundedBox args={[0.34, 0.16, 0.05]} radius={0.02} material={CASE_ALUMINUM_WORN} />
      <mesh position={[0, -0.02, 0.03]} material={SCREW_STEEL}>
        <boxGeometry args={[0.1, 0.05, 0.02]} />
      </mesh>
    </group>
  );
}

function CornerScrew({ x, z, brass = false }: { x: number; z: number; brass?: boolean }) {
  return (
    <mesh position={[x, CASE_H + 0.005, z]} rotation={[-Math.PI / 2, 0, 0]} material={brass ? SCREW_BRASS : SCREW_STEEL}>
      <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
    </mesh>
  );
}

interface FieldCaseProps {
  /** 0 = closed, 1 = fully open; the shell animates this for the ritual */
  openAmount: number;
  /** mission code — etched on the brass plate and the rear serial plate */
  code: string;
  /** phosphor countdown text (null = untimed mission, readout shows READY) */
  clock: string | null;
  /** current mission alarm state, for the jewel-lamp strip */
  strikes: number;
  maxStrikes: number;
  alarmFlash: boolean;
  /** faceplates racked in the base (world-space slots) */
  baseChildren?: React.ReactNode;
  /** faceplates racked in the lid — parented to the hinge so they inherit its motion */
  lidChildren?: React.ReactNode;
}

export function FieldCase({ openAmount, code, clock, strikes, maxStrikes, alarmFlash, baseChildren, lidChildren }: FieldCaseProps) {
  const lidRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (lidRef.current) {
      lidRef.current.rotation.x = LID_OPEN_ANGLE * openAmount;
    }
    if (flashRef.current) {
      flashRef.current.intensity = alarmFlash ? 2.2 : 0;
    }
  });

  return (
    <group>
      {/* ---- base shell ---- */}
      <RoundedBox args={[CASE_W, CASE_H, CASE_D]} radius={0.06} position={[0, CASE_H / 2, 0]} material={CASE_ALUMINUM} />
      {/* interior floor (felt) — proud of the solid shell so it actually shows */}
      <mesh position={[0, CASE_H + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} material={CASE_INTERIOR}>
        <planeGeometry args={[CASE_W - 0.36, CASE_D - 0.36]} />
      </mesh>
      {/* reinforced edge banding */}
      {[-1, 1].map((s) => (
        <RoundedBox
          key={s}
          args={[0.12, CASE_H + 0.02, CASE_D + 0.02]}
          radius={0.04}
          position={[s * (CASE_W / 2 - 0.05), CASE_H / 2, 0]}
          material={CASE_ALUMINUM_WORN}
        />
      ))}
      <Latch x={-1.5} />
      <Latch x={1.5} />
      {/* corner screws — one non-matching brass replacement (field-used tell) */}
      <CornerScrew x={-(CASE_W / 2 - 0.16)} z={CASE_D / 2 - 0.16} />
      <CornerScrew x={CASE_W / 2 - 0.16} z={CASE_D / 2 - 0.16} brass />
      <CornerScrew x={-(CASE_W / 2 - 0.16)} z={-(CASE_D / 2 - 0.16)} />
      <CornerScrew x={CASE_W / 2 - 0.16} z={-(CASE_D / 2 - 0.16)} />

      {/* handle on the front face */}
      <group position={[0, CASE_H / 2, CASE_D / 2 + 0.06]}>
        <mesh material={CASE_ALUMINUM_WORN} rotation={[0, 0, Math.PI / 2]} position={[0, -0.05, 0.1]}>
          <cylinderGeometry args={[0.045, 0.045, 1.1, 16]} />
        </mesh>
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} material={CASE_ALUMINUM_WORN} rotation={[Math.PI / 2, 0, 0]} position={[x, -0.05, 0.05]}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
          </mesh>
        ))}
      </group>

      {/* alarm jewel-lamp strip on the front edge of the base */}
      <group position={[0, CASE_H - 0.14, CASE_D / 2 + 0.012]}>
        <RoundedBox args={[0.22 * maxStrikes + 0.14, 0.2, 0.03]} radius={0.02} material={CASE_ALUMINUM_WORN} />
        {Array.from({ length: maxStrikes }, (_, i) => (
          <mesh
            key={i}
            position={[(i - (maxStrikes - 1) / 2) * 0.22, 0, 0.03]}
            rotation={[Math.PI / 2, 0, 0]}
            material={i < strikes ? LAMP_RED : LAMP_OFF}
          >
            <sphereGeometry args={[0.055, 16, 12]} />
          </mesh>
        ))}
      </group>
      <pointLight ref={flashRef} position={[0, CASE_H + 0.4, CASE_D / 2 + 0.5]} color="#ff5a5a" intensity={0} distance={4} />

      {/* phosphor countdown tube inset on the front edge */}
      <group position={[1.35, CASE_H - 0.14, CASE_D / 2 + 0.012]}>
        <RoundedBox args={[0.72, 0.22, 0.03]} radius={0.02} material={CASE_ALUMINUM_WORN} />
        <Html transform occlude position={[0, 0, 0.018]} scale={0.07} wrapperClass="faceplate-wrap" zIndexRange={[10, 0]}>
          <div className="case-phosphor" aria-hidden="true">{clock ?? 'READY'}</div>
        </Html>
      </group>

      {/* rear serial plate — only readable by turning the case (spatial-language bait) */}
      <group position={[0.9, CASE_H / 2, -CASE_D / 2 - 0.012]} rotation={[0, Math.PI, 0]}>
        <RoundedBox args={[1.3, 0.3, 0.02]} radius={0.02} material={BRASS} />
        <Html transform occlude position={[0, 0, 0.014]} scale={0.07} wrapperClass="faceplate-wrap" zIndexRange={[10, 0]}>
          <div className="case-etched case-etched-rear" aria-hidden="true">FIELD CASE · UNIT {code}</div>
        </Html>
      </group>

      {baseChildren}

      {/* ---- lid (hinged at the back edge) ---- */}
      <group position={[0, CASE_H, -CASE_D / 2]}>
        <group ref={lidRef}>
          {lidChildren}
          <group position={[0, LID_H / 2, CASE_D / 2]}>
            <RoundedBox args={[CASE_W, LID_H, CASE_D]} radius={0.06} material={CASE_ALUMINUM} />
            {/* lid interior lining (faces the player when open) */}
            <mesh position={[0, -LID_H / 2 - 0.006, 0]} rotation={[Math.PI / 2, 0, 0]} material={CASE_INTERIOR}>
              <planeGeometry args={[CASE_W - 0.36, CASE_D - 0.36]} />
            </mesh>
            {/* brass mission plate riveted inside the lid, low edge */}
            <group position={[0, -LID_H / 2 - 0.03, 0.1]}>
              <RoundedBox args={[1.5, 0.03, 0.42]} radius={0.01} material={BRASS} />
              <Html
                transform
                occlude
                position={[0, -0.022, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={0.07}
                wrapperClass="faceplate-wrap"
                zIndexRange={[10, 0]}
              >
                <div className="case-etched case-etched-dark" aria-hidden="true">MISSION {code}</div>
              </Html>
            </group>
          </group>
        </group>
      </group>

      {/* hinge barrels */}
      {[-1.6, 0, 1.6].map((x) => (
        <mesh key={x} position={[x, CASE_H, -CASE_D / 2]} rotation={[0, 0, Math.PI / 2]} material={CASE_ALUMINUM_WORN}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
        </mesh>
      ))}
    </group>
  );
}
