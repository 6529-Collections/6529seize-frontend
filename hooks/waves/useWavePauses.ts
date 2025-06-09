import { useMemo } from "react";
import { ApiWave } from "../../generated/models/ApiWave";
import { ApiWaveDecisionPause } from "../../generated/models/ApiWaveDecisionPause";
import { ApiWaveDecision } from "../../generated/models/ApiWaveDecision";

// Extend ApiWave type to include pauses until OpenAPI generation is fixed
interface ApiWaveWithPauses extends ApiWave {
  pauses?: Array<ApiWaveDecisionPause>;
}

interface UseWavePausesResult {
  isPaused: boolean;
  currentPause: ApiWaveDecisionPause | null;
  filteredDecisions: ApiWaveDecision[];
  nextDecisionTime: number | null;
  nextDecision: ApiWaveDecision | null;
}

interface UseWavePausesProps {
  wave: ApiWave | null;
  decisions?: ApiWaveDecision[];
}

export function useWavePauses({ wave, decisions = [] }: UseWavePausesProps): UseWavePausesResult {
  const now = Date.now();
  
  // Cast wave to include pauses property
  const waveWithPauses = wave as ApiWaveWithPauses | null;

  const currentPause = useMemo(() => {
    if (!waveWithPauses?.pauses || waveWithPauses.pauses.length === 0) return null;
    
    return waveWithPauses.pauses.find(pause => 
      now >= pause.start_time && now <= pause.end_time
    ) || null;
  }, [waveWithPauses?.pauses, now]);

  const isPaused = useMemo(() => {
    return currentPause !== null;
  }, [currentPause]);

  const filteredDecisions = useMemo(() => {
    if (!waveWithPauses?.pauses || waveWithPauses.pauses.length === 0) return decisions;

    return decisions.filter(decision => {
      return !waveWithPauses.pauses!.some(pause => 
        decision.decision_time >= pause.start_time && 
        decision.decision_time <= pause.end_time
      );
    });
  }, [decisions, waveWithPauses?.pauses]);

  const nextDecision = useMemo(() => {
    const futureDecisions = filteredDecisions.filter(d => d.decision_time > now);
    if (futureDecisions.length === 0) return null;
    
    return futureDecisions.reduce((earliest, current) => 
      current.decision_time < earliest.decision_time ? current : earliest
    );
  }, [filteredDecisions, now]);

  const nextDecisionTime = useMemo(() => {
    return nextDecision?.decision_time || null;
  }, [nextDecision]);

  return {
    isPaused,
    currentPause,
    filteredDecisions,
    nextDecisionTime,
    nextDecision
  };
} 