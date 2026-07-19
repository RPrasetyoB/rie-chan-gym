import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const goals = [
        { key: 'lose_weight', title: 'Lose Weight', description: 'Reduce body fat with safe, sustainable programming' },
        { key: 'build_muscle', title: 'Build Muscle', description: 'Hypertrophy-focused training with progressive overload' },
        { key: 'strength', title: 'Strength', description: 'Low-rep strength progression' },
        { key: 'general_fitness', title: 'General Fitness', description: 'Balanced all-around health and conditioning' },
    ];
    for (const goal of goals) {
        await prisma.goal.upsert({
            where: { key: goal.key },
            update: goal,
            create: goal,
        });
    }
    const categories = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];
    for (const name of categories) {
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    const equipment = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];
    for (const name of equipment) {
        await prisma.equipment.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps', 'Quads', 'Glutes', 'Hamstrings', 'Core'];
    for (const name of muscleGroups) {
        await prisma.muscleGroup.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    const achievements = [
        { key: '7-day-streak', title: '7-Day Streak', description: 'Train seven days in a row', category: 'consistency', threshold: 7, icon: '🔥' },
        { key: 'first-100kg-squat', title: 'First 100kg Squat', description: 'Hit a 100kg squat', category: 'strength', threshold: 100, icon: '🏋️' },
    ];
    for (const achievement of achievements) {
        await prisma.achievementDefinition.upsert({
            where: { key: achievement.key },
            update: achievement,
            create: achievement,
        });
    }
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
