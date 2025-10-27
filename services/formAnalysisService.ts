// services/formAnalysisService.ts
interface Keypoint {
  x: number;
  y: number;
  score: number;
  name?: string;
}

type Pose = Keypoint[];

// Helper to get a keypoint by name
const getKeypoint = (pose: Pose, name: string) => pose.find(p => p.name === name);

// Helper to calculate angle between three points
const calculateAngle = (a: Keypoint, b: Keypoint, c: Keypoint) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
};

export class SquatAnalyzer {
  private stage: 'up' | 'down' = 'up';
  private repCount = 0;
  private feedback: Set<string> = new Set();
  private minVisibility = 0.6; // Confidence threshold for keypoints

  public analyze(pose: Pose) {
    this.feedback.clear();

    const leftHip = getKeypoint(pose, 'left_hip');
    const rightHip = getKeypoint(pose, 'right_hip');
    const leftKnee = getKeypoint(pose, 'left_knee');
    const rightKnee = getKeypoint(pose, 'right_knee');
    const leftAnkle = getKeypoint(pose, 'left_ankle');
    const rightAnkle = getKeypoint(pose, 'right_ankle');
    const leftShoulder = getKeypoint(pose, 'left_shoulder');
    const rightShoulder = getKeypoint(pose, 'right_shoulder');

    // Check if all necessary keypoints are visible
    const requiredKeypoints = [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle, leftShoulder, rightShoulder];
    if (requiredKeypoints.some(p => !p || p.score < this.minVisibility)) {
      this.feedback.add("Posizionati in modo che il corpo sia completamente visibile.");
      return { feedback: Array.from(this.feedback), repCount: this.repCount };
    }

    // Use average of left/right side for simplicity
    const hipY = (leftHip!.y + rightHip!.y) / 2;
    const kneeY = (leftKnee!.y + rightKnee!.y) / 2;
    const shoulderY = (leftShoulder!.y + rightShoulder!.y) / 2;

    const leftKneeAngle = calculateAngle(leftHip!, leftKnee!, leftAnkle!);
    const rightKneeAngle = calculateAngle(rightHip!, rightKnee!, rightAnkle!);
    const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    
    // Depth check
    const isDeepEnough = hipY > kneeY; // In screen coordinates, higher Y is lower.

    // Repetition logic
    if (kneeAngle > 160) { // Standing up
      if (this.stage === 'down') {
          if (isDeepEnough) {
            this.repCount++;
          } else {
            this.feedback.add("Scendi più in profondità! L'anca deve superare il ginocchio.");
          }
          this.stage = 'up';
      }
    } else if (kneeAngle < 100) { // At the bottom of the squat
        if (this.stage === 'up') {
            this.stage = 'down';
        }
    }
    
    // Knee valgus check (knees collapsing inward) - Simplified
    const hipWidth = Math.abs(leftHip!.x - rightHip!.x);
    const kneeWidth = Math.abs(leftKnee!.x - rightKnee!.x);
    if (this.stage === 'down' && kneeWidth < hipWidth * 0.8) {
        this.feedback.add("Non far collassare le ginocchia verso l'interno!");
    }
    
    // Chest up check (torso angle) - Simplified
    const torsoUpright = hipY > shoulderY;
    if (this.stage === 'down' && !torsoUpright) {
        this.feedback.add("Mantieni il petto in fuori e la schiena dritta!");
    }

    if (this.feedback.size === 0 && this.stage === 'down') {
        this.feedback.add("Ottima forma!");
    }

    return {
      feedback: Array.from(this.feedback),
      repCount: this.repCount,
    };
  }

  public getRepCount() {
    return this.repCount;
  }
}

// Factory function to get the correct analyzer
export const getExerciseAnalyzer = (exerciseName: string) => {
    const lowerCaseName = exerciseName.toLowerCase();
    if (lowerCaseName.includes('squat')) {
        return new SquatAnalyzer();
    }
    // Return a default null analyzer for other exercises for now
    return { 
        analyze: () => ({ feedback: ["Analisi non disponibile per questo esercizio."], repCount: 0 }),
        getRepCount: () => 0
    };
};