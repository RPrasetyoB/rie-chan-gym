type ExerciseMedia = {
  gifUrl: string
  alt: string
}

type ExerciseMediaEntry = {
  id: string
  name: string
  gifUrl: string
  aliases?: string[]
}

const EXERCISE_MEDIA: ExerciseMediaEntry[] = [
  { id: 'bench_press', name: 'Bench Press', gifUrl: '/assets/exercises/bench_press.gif', aliases: ['barbell bench press'] },
  { id: 'incline_db_press', name: 'Incline Dumbbell Press', gifUrl: '/assets/exercises/incline_db_press.gif', aliases: ['dumbbell press on exercise ball', 'dumbbell incline press'] },
  { id: 'cable_fly', name: 'Cable Fly', gifUrl: '/assets/exercises/cable_fly.gif', aliases: ['cable incline fly', 'cable low fly'] },
  { id: 'push_up', name: 'Push Up', gifUrl: '/assets/exercises/push_up.gif', aliases: ['decline push-up', 'close-grip push-up'] },
  { id: 'deadlift', name: 'Deadlift', gifUrl: '/assets/exercises/deadlift.gif', aliases: ['barbell deadlift'] },
  { id: 'pull_up', name: 'Pull Up', gifUrl: '/assets/exercises/pull_up.gif', aliases: ['pull up (neutral grip)', 'archer pull up'] },
  { id: 'lat_pulldown', name: 'Lat Pulldown', gifUrl: '/assets/exercises/lat_pulldown.gif', aliases: ['cable lat pulldown full range of motion'] },
  { id: 'overhead_press', name: 'Overhead Press', gifUrl: '/assets/exercises/overhead_press.gif', aliases: ['dumbbell standing overhead press', 'dumbbell seated shoulder press'] },
  { id: 'lateral_raise', name: 'Lateral Raise', gifUrl: '/assets/exercises/lateral_raise.gif', aliases: ['dumbbell lateral raise'] },
  { id: 'bicep_curl', name: 'Bicep Curl', gifUrl: '/assets/exercises/bicep_curl.gif', aliases: ['dumbbell biceps curl', 'barbell curl'] },
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', gifUrl: '/assets/exercises/tricep_pushdown.gif', aliases: ['cable triceps pushdown (v-bar)', 'cable pushdown'] },
  { id: 'squat', name: 'Squat', gifUrl: '/assets/exercises/squat.gif', aliases: ['barbell full squat', 'barbell front squat'] },
  { id: 'leg_press', name: 'Leg Press', gifUrl: '/assets/exercises/leg_press.gif', aliases: ['sled 45° leg press (side pov)', 'sled 45 degrees one leg press'] },
  { id: 'lunge', name: 'Lunge', gifUrl: '/assets/exercises/lunge.gif', aliases: ['dumbbell lunge', 'barbell lunge'] },
  { id: 'plank', name: 'Plank', gifUrl: '/assets/exercises/plank.gif', aliases: ['weighted front plank', 'front plank with twist'] },
  { id: 'crunch', name: 'Crunch', gifUrl: '/assets/exercises/crunch.gif', aliases: ['cable seated crunch', 'reverse crunch'] },
  { id: 'barbell_glute_bridge', name: 'Barbell Glute Bridge', gifUrl: '/assets/exercises/1409.gif', aliases: ['barbell glute bridge'] },
  { id: 'glute_bridge_march', name: 'Glute Bridge March', gifUrl: '/assets/exercises/3561.gif', aliases: ['glute bridge march'] },
  { id: 'low_glute_bridge_on_floor', name: 'Low Glute Bridge On Floor', gifUrl: '/assets/exercises/3013.gif', aliases: ['low glute bridge on floor'] },
  { id: 'resistance_band_hip_thrusts_on_knees', name: 'Resistance Band Hip Thrusts On Knees', gifUrl: '/assets/exercises/3236.gif', aliases: ['resistance band hip thrusts on knees', 'band hip thrusts on knees'] },
  { id: 'single_leg_bridge_with_outstretched_leg', name: 'Single Leg Bridge With Outstretched Leg', gifUrl: '/assets/exercises/3645.gif', aliases: ['single leg bridge with outstretched leg'] },
  { id: 'side_hip_abduction', name: 'Side Hip Abduction', gifUrl: '/assets/exercises/0710.gif', aliases: ['side hip abduction'] },
  { id: '0003', name: 'Air Bike', gifUrl: '/assets/exercises/0003.gif', aliases: ['air bike'] },
  { id: '1160', name: 'Burpee', gifUrl: '/assets/exercises/1160.gif', aliases: ['burpee'] },
  { id: '1201', name: 'Dumbbell Burpee', gifUrl: '/assets/exercises/1201.gif', aliases: ['dumbbell burpee'] },
  { id: '0501', name: 'Jack Burpee', gifUrl: '/assets/exercises/0501.gif', aliases: ['jack burpee'] },
  { id: '2612', name: 'Jump Rope', gifUrl: '/assets/exercises/2612.gif', aliases: ['jump rope'] },
  { id: '0630', name: 'Mountain Climber', gifUrl: '/assets/exercises/0630.gif', aliases: ['mountain climber'] },
  { id: '2138', name: 'Stationary Bike Run V. 3', gifUrl: '/assets/exercises/2138.gif', aliases: ['stationary bike run v. 3'] },
  { id: '0798', name: 'Stationary Bike Walk', gifUrl: '/assets/exercises/0798.gif', aliases: ['stationary bike walk'] },
  { id: '2141', name: 'Walk Elliptical Cross Trainer', gifUrl: '/assets/exercises/2141.gif', aliases: ['walk elliptical cross trainer'] },
  { id: '3655', name: 'Walking High Knees Lunge', gifUrl: '/assets/exercises/3655.gif', aliases: ['walking high knees lunge'] },
  { id: '3666', name: 'Walking on Incline Treadmill', gifUrl: '/assets/exercises/3666.gif', aliases: ['walking on incline treadmill'] },
  { id: '0858', name: 'Wind Sprints', gifUrl: '/assets/exercises/0858.gif', aliases: ['wind sprints'] },
  { id: 'all_fours_squad_stretch', name: 'All Fours Squad Stretch', gifUrl: '/assets/exercises/all_fours_squad_stretch.gif', aliases: ['all fours squad stretch'] },
  { id: 'ankle_circles', name: 'Ankle Circles', gifUrl: '/assets/exercises/ankle_circles.gif', aliases: ['ankle circles'] },
  { id: 'pelvic_tilt', name: 'Pelvic Tilt', gifUrl: '/assets/exercises/pelvic_tilt.gif', aliases: ['pelvic tilt'] },
  { id: 'standing_pelvic_tilt', name: 'Standing Pelvic Tilt', gifUrl: '/assets/exercises/standing_pelvic_tilt.gif', aliases: ['standing pelvic tilt'] },
  { id: 'bodyweight_incline_side_plank', name: 'Bodyweight Incline Side Plank', gifUrl: '/assets/exercises/bodyweight_incline_side_plank.gif', aliases: ['bodyweight incline side plank'] },
  { id: 'front_plank_with_twist', name: 'Front Plank With Twist', gifUrl: '/assets/exercises/front_plank_with_twist.gif', aliases: ['front plank with twist'] },
  { id: 'reverse_crunch', name: 'Reverse Crunch', gifUrl: '/assets/exercises/reverse_crunch.gif', aliases: ['reverse crunch'] },
  { id: 'captains_chair_straight_leg_raise', name: "Captain's Chair Straight Leg Raise", gifUrl: '/assets/exercises/captains_chair_straight_leg_raise.gif', aliases: ["captain's chair straight leg raise"] },
  { id: 'hip_internal_rotation', name: 'Hip Internal Rotation', gifUrl: '/assets/exercises/hip_internal_rotation.gif', aliases: ['hip internal rotation'] },
  { id: 'lying_glutes_stretch', name: 'Lying Glutes Stretch', gifUrl: '/assets/exercises/lying_glutes_stretch.gif', aliases: ['lying glutes stretch'] },
  { id: '0047', name: 'Barbell Incline Bench Press', gifUrl: '/assets/exercises/0047.gif', aliases: ['barbell incline bench press'] },
  { id: '0122', name: 'Barbell Wide Bench Press', gifUrl: '/assets/exercises/0122.gif', aliases: ['barbell wide bench press'] },
  { id: '0151', name: 'Cable Bench Press', gifUrl: '/assets/exercises/0151.gif', aliases: ['cable bench press'] },
  { id: '0169', name: 'Cable Incline Bench Press', gifUrl: '/assets/exercises/0169.gif', aliases: ['cable incline bench press'] },
  { id: '0171', name: 'Cable Incline Fly', gifUrl: '/assets/exercises/0171.gif', aliases: ['cable incline fly'] },
  { id: '0970', name: 'Band Assisted Pull-Up', gifUrl: '/assets/exercises/0970.gif', aliases: ['band assisted pull up'] },
  { id: '0974', name: 'Band Close-Grip Pulldown', gifUrl: '/assets/exercises/0974.gif', aliases: ['band close grip pulldown'] },
  { id: '0983', name: 'Band Kneeling One Arm Pulldown', gifUrl: '/assets/exercises/0983.gif', aliases: ['band kneeling one arm pulldown'] },
  { id: '0027', name: 'Barbell Bent Over Row', gifUrl: '/assets/exercises/0027.gif', aliases: ['barbell bent over row'] },
  { id: '3017', name: 'Barbell Pendlay Row', gifUrl: '/assets/exercises/3017.gif', aliases: ['barbell pendlay row'] },
  { id: '0978', name: 'Band Front Raise', gifUrl: '/assets/exercises/0978.gif', aliases: ['band front raise'] },
  { id: '1012', name: 'Band Twisting Overhead Press', gifUrl: '/assets/exercises/1012.gif', aliases: ['band twisting overhead press'] },
  { id: '1017', name: 'Band Y-Raise', gifUrl: '/assets/exercises/1017.gif', aliases: ['band y raise'] },
  { id: '0076', name: 'Barbell Rear Delt Row', gifUrl: '/assets/exercises/0076.gif', aliases: ['barbell rear delt row'] },
  { id: '0148', name: 'Cable Alternate Shoulder Press', gifUrl: '/assets/exercises/0148.gif', aliases: ['cable alternate shoulder press'] },
  { id: '0968', name: 'Band Alternating Biceps Curl', gifUrl: '/assets/exercises/0968.gif', aliases: ['band alternating biceps curl'] },
  { id: '0976', name: 'Band Concentration Curl', gifUrl: '/assets/exercises/0976.gif', aliases: ['band concentration curl'] },
  { id: '0986', name: 'Band One Arm Overhead Biceps Curl', gifUrl: '/assets/exercises/0986.gif', aliases: ['band one arm overhead biceps curl'] },
  { id: '0052', name: 'Barbell JM Bench Press', gifUrl: '/assets/exercises/0052.gif', aliases: ['barbell jm bench press'] },
  { id: '0061', name: 'Barbell Lying Triceps Extension', gifUrl: '/assets/exercises/0061.gif', aliases: ['barbell lying triceps extension'] },
  { id: '0980', name: 'Band Bent-Over Hip Extension', gifUrl: '/assets/exercises/0980.gif', aliases: ['band bent over hip extension'] },
  { id: '0987', name: 'Band One Arm Single Leg Split Squat', gifUrl: '/assets/exercises/0987.gif', aliases: ['band one arm single leg split squat'] },
  { id: '0991', name: 'Band Pull Through', gifUrl: '/assets/exercises/0991.gif', aliases: ['band pull through'] },
  { id: '1008', name: 'Band Step-Up', gifUrl: '/assets/exercises/1008.gif', aliases: ['band step up'] },
  { id: '0032', name: 'Barbell Deadlift', gifUrl: '/assets/exercises/0032.gif', aliases: ['barbell deadlift'] },
  { id: '0969', name: 'Band Alternating V-Up', gifUrl: '/assets/exercises/0969.gif', aliases: ['band alternating v up'] },
  { id: '0972', name: 'Band Bicycle Crunch', gifUrl: '/assets/exercises/0972.gif', aliases: ['band bicycle crunch'] },
  { id: '0992', name: 'Band Push Sit-Up', gifUrl: '/assets/exercises/0992.gif', aliases: ['band push sit up'] },
  { id: '1005', name: 'Band Standing Crunch', gifUrl: '/assets/exercises/1005.gif', aliases: ['band standing crunch'] },
  { id: '1011', name: 'Band Seated Twist', gifUrl: '/assets/exercises/1011.gif', aliases: ['band seated twist'] },
  { id: '1014', name: 'Band V-Up', gifUrl: '/assets/exercises/1014.gif', aliases: ['band v up'] },
  { id: '0071', name: 'Barbell Press Sit-Up', gifUrl: '/assets/exercises/0071.gif', aliases: ['barbell press sit up'] },
  { id: '0084', name: 'Barbell Rollerout', gifUrl: '/assets/exercises/0084.gif', aliases: ['barbell rollerout'] },
  { id: '0094', name: 'Barbell Seated Twist', gifUrl: '/assets/exercises/0094.gif', aliases: ['barbell seated twist'] },
  { id: '0103', name: 'Barbell Standing Ab Rollerout', gifUrl: '/assets/exercises/0103.gif', aliases: ['barbell standing ab rollerout'] },
  { id: '3360', name: 'Bear Crawl', gifUrl: '/assets/exercises/3360.gif', aliases: ['bear crawl'] },
  { id: '3223', name: 'Star Jump', gifUrl: '/assets/exercises/3223.gif', aliases: ['star jump'] },
  { id: '3637', name: 'Wheel Run', gifUrl: '/assets/exercises/3637.gif', aliases: ['wheel run'] },
]

const mediaLookup = new Map<string, ExerciseMediaEntry>()

for (const entry of EXERCISE_MEDIA) {
  mediaLookup.set(entry.id, entry)
  mediaLookup.set(normalizeKey(entry.name), entry)
  for (const alias of entry.aliases ?? []) {
    mediaLookup.set(normalizeKey(alias), entry)
  }
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function getExerciseMedia(exerciseId?: string, exerciseName?: string): ExerciseMedia | null {
  if (exerciseId && mediaLookup.has(exerciseId)) {
    const entry = mediaLookup.get(exerciseId)!
    return { gifUrl: entry.gifUrl, alt: entry.name }
  }

  if (exerciseName) {
    const entry = mediaLookup.get(normalizeKey(exerciseName))
    if (entry) {
      return { gifUrl: entry.gifUrl, alt: entry.name }
    }
  }

  return null
}
