function calculateBMI(weight, height) {
    if (height <= 0) {
        throw new Error("Height must be greater than zero.");
    }
    return weight / (height * height);
}

function getBodyCondition(bmi) {
    if (bmi < 18.5) {
        return "Underweight";
    } else if (bmi >= 18.5 && bmi < 24.9) {
        return "Normal weight";
    } else if (bmi >= 25 && bmi < 29.9) {
        return "Overweight";
    } else {
        return "Obesity";
    }
}

function getBMIInfo(weight, height) {
    const bmi = calculateBMI(weight, height);
    const condition = getBodyCondition(bmi);
    return {
        bmi: bmi.toFixed(2),
        condition: condition
    };
}