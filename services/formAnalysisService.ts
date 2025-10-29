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

interface AnalysisResult {
  feedback: string[];
  repCount: number;
  badKeypoints: string[];
}

abstract class ExerciseAnalyzer {
  protected stage: 'up' | 'down' | 'start' = 'start';
  protected repCount = 0;
  protected feedback: Set<string> = new Set();
  protected badKeypoints: Set<string> = new Set();
  protected minVisibility = 0.6; // Confidence threshold for keypoints

  abstract analyze(pose: Pose): AnalysisResult;
  
  public getRepCount(): number {
    return this.repCount;
  }
}

class SquatAnalyzer extends ExerciseAnalyzer {
  constructor() {
    super();
    this.stage = 'up';
  }

  public analyze(pose: Pose): AnalysisResult {
    this.feedback.clear();
    this.badKeypoints.clear();

    const required = ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_shoulder', 'right_shoulder'];
    const keypoints = required.map(name => getKeypoint(pose, name));

    if (keypoints.some(p => !p || p.score < this.minVisibility)) {
      this.feedback.add("Posizionati in modo che il corpo sia completamente visibile.");
      return { feedback: Array.from(this.feedback), repCount: this.repCount, badKeypoints: [] };
    }
    
    const [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle, leftShoulder, rightShoulder] = keypoints as Keypoint[];

    const hipY = (leftHip.y + rightHip.y) / 2;
    const kneeY = (leftKnee.y + rightKnee.y) / 2;
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    
    const isDeepEnough = hipY > kneeY;

    if (kneeAngle > 160) {
      if (this.stage === 'down') {
          if (!isDeepEnough) {
            this.feedback.add("Scendi più in profondità! L'anca deve superare il ginocchio.");
            this.badKeypoints.add('left_hip').add('right_hip');
          } else {
            this.repCount++;
          }
          this.stage = 'up';
      }
    } else if (kneeAngle < 100) {
        if (this.stage === 'up') {
            this.stage = 'down';
        }
    }
    
    if (this.stage === 'down') {
        const hipWidth = Math.abs(leftHip.x - rightHip.x);
        const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);
        if (kneeWidth < hipWidth * 0.8) {
            this.feedback.add("Non far collassare le ginocchia verso l'interno!");
            this.badKeypoints.add('left_knee').add('right_knee');
        }
        
        const torsoUpright = hipY > shoulderY;
        if (!torsoUpright) {
            this.feedback.add("Mantieni il petto in fuori e la schiena dritta!");
            this.badKeypoints.add('left_shoulder').add('right_shoulder').add('left_hip').add('right_hip');
        }
    }

    if (this.feedback.size === 0 && this.stage === 'down') {
        this.feedback.add("Ottima forma!");
    }

    return {
      feedback: Array.from(this.feedback),
      repCount: this.repCount,
      badKeypoints: Array.from(this.badKeypoints),
    };
  }
}

class PushUpAnalyzer extends ExerciseAnalyzer {
    constructor() {
        super();
        this.stage = 'up';
    }

    public analyze(pose: Pose): AnalysisResult {
        this.feedback.clear();
        this.badKeypoints.clear();
        
        const required = ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip'];
        const keypoints = required.map(name => getKeypoint(pose, name));

        if (keypoints.some(p => !p || p.score < this.minVisibility)) {
            this.feedback.add("Posizionati lateralmente alla fotocamera.");
            return { feedback: Array.from(this.feedback), repCount: this.repCount, badKeypoints: [] };
        }

        const [leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist, leftHip, rightHip] = keypoints as Keypoint[];
        
        const elbowAngle = (calculateAngle(leftShoulder, leftElbow, leftWrist) + calculateAngle(rightShoulder, rightElbow, rightWrist)) / 2;
        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipY = (leftHip.y + rightHip.y) / 2;

        if (elbowAngle > 160) { // Up position
            if (this.stage === 'down') {
                this.repCount++;
                this.stage = 'up';
            }
        } else if (elbowAngle < 90) { // Down position
            if (this.stage === 'up') {
                this.stage = 'down';
            }
        }

        if (Math.abs(shoulderY - hipY) > 25) { // Check for hip sag/pike
            this.feedback.add("Mantieni il corpo in linea retta!");
            this.badKeypoints.add('left_hip').add('right_hip');
        }

        if (this.stage === 'up' && this.repCount > 0 && elbowAngle < 100) {
             this.feedback.add("Non sei sceso abbastanza in profondità.");
             this.badKeypoints.add('left_elbow').add('right_elbow');
        }

        if (this.feedback.size === 0 && this.stage === 'down') {
            this.feedback.add("Forma corretta!");
        }

        return {
            feedback: Array.from(this.feedback),
            repCount: this.repCount,
            badKeypoints: Array.from(this.badKeypoints),
        };
    }
}

class BicepCurlAnalyzer extends ExerciseAnalyzer {
    private initialElbowPos: { x: number; y: number } | null = null;
    constructor() {
        super();
        this.stage = 'down';
    }

    public analyze(pose: Pose): AnalysisResult {
        this.feedback.clear();
        this.badKeypoints.clear();

        const required = ['right_shoulder', 'right_elbow', 'right_wrist']; // Analyze one side for simplicity
        const keypoints = required.map(name => getKeypoint(pose, name));

        if (keypoints.some(p => !p || p.score < this.minVisibility)) {
            this.feedback.add("Posiziona il braccio destro ben visibile alla fotocamera.");
            return { feedback: Array.from(this.feedback), repCount: this.repCount, badKeypoints: [] };
        }

        const [shoulder, elbow, wrist] = keypoints as Keypoint[];

        const elbowAngle = calculateAngle(shoulder, elbow, wrist);

        if (elbowAngle > 150) { // Down position
            if (this.stage === 'up') {
                this.stage = 'down';
                this.initialElbowPos = { x: elbow.x, y: elbow.y }; // Reset elbow position at start of rep
            }
        } else if (elbowAngle < 60) { // Up position
            if (this.stage === 'down') {
                this.repCount++;
                this.stage = 'up';
            }
        }

        if (this.stage === 'up' || (this.stage === 'down' && this.initialElbowPos)) {
            if (!this.initialElbowPos) this.initialElbowPos = { x: elbow.x, y: elbow.y };
            
            const dx = Math.abs(elbow.x - this.initialElbowPos.x);
            const dy = Math.abs(elbow.y - this.initialElbowPos.y);
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance > 30) { // Threshold for elbow movement
                this.feedback.add("Tieni il gomito fermo, non usare slancio!");
                this.badKeypoints.add('right_elbow');
            }
        }
        
        if (this.feedback.size === 0 && this.stage === 'up') {
            this.feedback.add("Movimento controllato!");
        }

        return {
            feedback: Array.from(this.feedback),
            repCount: this.repCount,
            badKeypoints: Array.from(this.badKeypoints),
        };
    }
}

class LungeAnalyzer extends ExerciseAnalyzer {
    constructor() {
        super();
        this.stage = 'up';
    }

    public analyze(pose: Pose): AnalysisResult {
        this.feedback.clear();
        this.badKeypoints.clear();

        const required = ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_shoulder'];
        const keypoints = required.map(name => getKeypoint(pose, name));

        if (keypoints.some(p => !p || p.score < this.minVisibility)) {
            this.feedback.add("Posizionati lateralmente alla fotocamera per l'affondo.");
            return { feedback: Array.from(this.feedback), repCount: this.repCount, badKeypoints: [] };
        }
        
        const [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle, leftShoulder] = keypoints as Keypoint[];

        // Use the knee that is further forward as the front knee for analysis
        const frontKnee = leftKnee.x < rightKnee.x ? leftKnee : rightKnee;
        const frontHip = leftKnee.x < rightKnee.x ? leftHip : rightHip;
        const frontAnkle = leftKnee.x < rightKnee.x ? leftAnkle : rightAnkle;
        const rearKnee = leftKnee.x < rightKnee.x ? rightKnee : leftKnee;

        const kneeAngle = calculateAngle(frontHip, frontKnee, frontAnkle);

        if (kneeAngle > 160) { // Up position
            if (this.stage === 'down') {
                this.repCount++;
                this.stage = 'up';
            }
        } else if (kneeAngle < 100) { // Down position
            if (this.stage === 'up') {
                this.stage = 'down';
            }
        }
        
        if (this.stage === 'down') {
            // Check depth: rear knee should be low
            if (rearKnee.y < frontHip.y * 0.9) {
                this.feedback.add("Scendi più in profondità con il ginocchio posteriore.");
                this.badKeypoints.add(rearKnee.name!);
            }

            // Check if front knee goes past ankle
            if (frontKnee.x < frontAnkle.x - 15) { // 15px tolerance
                this.feedback.add("Non superare la punta del piede con il ginocchio anteriore.");
                this.badKeypoints.add(frontKnee.name!);
            }

            // Check torso upright
            if (leftShoulder.x > frontHip.x + 20) {
                 this.feedback.add("Mantieni il busto eretto.");
                 this.badKeypoints.add('left_shoulder').add('right_shoulder');
            }
        }

        if (this.feedback.size === 0 && this.stage === 'down') {
            this.feedback.add("Forma corretta!");
        }

        return {
            feedback: Array.from(this.feedback),
            repCount: this.repCount,
            badKeypoints: Array.from(this.badKeypoints),
        };
    }
}

class BentOverRowAnalyzer extends ExerciseAnalyzer {
    private backAngle: number = 0;
    constructor() {
        super();
        this.stage = 'down';
    }

    public analyze(pose: Pose): AnalysisResult {
        this.feedback.clear();
        this.badKeypoints.clear();
        
        const required = ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip'];
        const keypoints = required.map(name => getKeypoint(pose, name));

        if (keypoints.some(p => !p || p.score < this.minVisibility)) {
            this.feedback.add("Posizionati lateralmente alla fotocamera per il rematore.");
            return { feedback: Array.from(this.feedback), repCount: this.repCount, badKeypoints: [] };
        }
        
        const [leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist, leftHip, rightHip] = keypoints as Keypoint[];

        const shoulder = (leftShoulder.score > rightShoulder.score) ? leftShoulder : rightShoulder;
        const elbow = (leftShoulder.score > rightShoulder.score) ? leftElbow : rightElbow;
        const wrist = (leftShoulder.score > rightShoulder.score) ? leftWrist : rightWrist;
        const hip = (leftShoulder.score > rightShoulder.score) ? leftHip : rightHip;

        const elbowAngle = calculateAngle(shoulder, elbow, wrist);
        const currentBackAngle = calculateAngle(shoulder, hip, {x: hip.x, y: hip.y - 100, score: 1}); // Angle with vertical

        if (this.stage === 'down' && this.backAngle === 0) {
            this.backAngle = currentBackAngle; // Set initial back angle
        }

        if (elbowAngle < 90) { // Up position (pulled)
            if (this.stage === 'down') {
                this.repCount++;
                this.stage = 'up';
            }
        } else if (elbowAngle > 150) { // Down position (extended)
            if (this.stage === 'up') {
                this.stage = 'down';
                this.backAngle = currentBackAngle; // Reset back angle for next rep
            }
        }

        if (Math.abs(currentBackAngle - this.backAngle) > 15) {
            this.feedback.add("Non dondolare! Mantieni la schiena ferma e piatta.");
            this.badKeypoints.add('left_hip').add('right_hip').add('left_shoulder').add('right_shoulder');
        }

        if (this.feedback.size === 0 && this.stage === 'up') {
            this.feedback.add("Ottima tirata!");
        }

        return {
            feedback: Array.from(this.feedback),
            repCount: this.repCount,
            badKeypoints: Array.from(this.badKeypoints),
        };
    }
}

class OverheadPressAnalyzer extends ExerciseAnalyzer {
    constructor() {
        super();
        this.stage = 'down';
    }

    public analyze(pose: Pose): AnalysisResult {
        this.feedback.clear();
        this.badKeypoints.clear();

        const required = ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip'];
        const keypoints = required.map(name => getKeypoint(pose, name));
        
        if (keypoints.some(p => !p || p.score < this.minVisibility)) {
            this.feedback.add("Posizionati frontalmente o leggermente di lato.");
            return { feedback: Array.from(this.feedback), repCount: this.repCount, badKeypoints: [] };
        }
        
        const [leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist, leftHip, rightHip] = keypoints as Keypoint[];

        const elbowAngle = (calculateAngle(leftShoulder, leftElbow, leftWrist) + calculateAngle(rightShoulder, rightElbow, rightWrist)) / 2;
        const wristY = (leftWrist.y + rightWrist.y) / 2;
        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;

        if (elbowAngle > 160 && wristY < shoulderY) { // Up position
            if (this.stage === 'down') {
                this.repCount++;
                this.stage = 'up';
            }
        } else if (elbowAngle < 90) { // Down position
            if (this.stage === 'up') {
                this.stage = 'down';
            }
        }
        
        if (this.stage === 'up') {
            const hipX = (leftHip.x + rightHip.x) / 2;
            const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
            if (Math.abs(hipX - shoulderX) > 40) { // Check for excessive lean/arch
                this.feedback.add("Evita di inarcare la schiena, contrai l'addome.");
                this.badKeypoints.add('left_hip').add('right_hip');
            }
        }
        
        if (this.stage === 'down' && wristY > shoulderY + 20) {
            this.feedback.add("Scendi di più, porta il bilanciere/manubri alle spalle.");
            this.badKeypoints.add('left_wrist').add('right_wrist');
        }

        if (this.feedback.size === 0 && this.stage === 'up') {
            this.feedback.add("Spinta eccellente!");
        }

        return {
            feedback: Array.from(this.feedback),
            repCount: this.repCount,
            badKeypoints: Array.from(this.badKeypoints),
        };
    }
}


// Factory function to get the correct analyzer
export const getExerciseAnalyzer = (exerciseName: string): ExerciseAnalyzer => {
    const lowerCaseName = exerciseName.toLowerCase();
    if (lowerCaseName.includes('squat')) {
        return new SquatAnalyzer();
    }
    if (lowerCaseName.includes('push up') || lowerCaseName.includes('piegamenti')) {
        return new PushUpAnalyzer();
    }
    if (lowerCaseName.includes('curl')) {
        return new BicepCurlAnalyzer();
    }
    if (lowerCaseName.includes('affondi') || lowerCaseName.includes('lunge')) {
        return new LungeAnalyzer();
    }
    if (lowerCaseName.includes('rematore') || lowerCaseName.includes('row')) {
        return new BentOverRowAnalyzer();
    }
    if (lowerCaseName.includes('overhead press') || lowerCaseName.includes('lento avanti') || lowerCaseName.includes('military press')) {
        return new OverheadPressAnalyzer();
    }
    // Return a default null analyzer for other exercises
    // FIX: Replaced the object literal cast with an anonymous class that extends ExerciseAnalyzer
    // to satisfy TypeScript's type checking for abstract classes without creating a new named class.
    return new (class extends ExerciseAnalyzer {
        analyze(pose: Pose): AnalysisResult {
            return {
                feedback: ["Analisi non disponibile per questo esercizio."],
                repCount: 0,
                badKeypoints: [],
            };
        }
    })();
};