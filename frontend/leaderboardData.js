// leaderboardData.js
const allNames = [
    "Aarav Sharma", "Vivaan Gupta", "Aditya Verma", "Vihaan Singh", "Arjun Yadav", "Sai Mishra", "Reyansh Thakur", "Aaryan Patel", "Ishaan Malhotra", "Krishna Das",
    "Diya Kumari", "Ananya Singh", "Priya Sharma", "Saanvi Gupta", "Myra Verma", "Riya Yadav", "Anjali Mishra", "Ipshita Thakur", "Kajal Patel", "Sneha Malhotra",
    "Rahul Kumar", "Amit Singh", "Sumit Sharma", "Vikram Gupta", "Rohan Verma", "Sana Yadav", "Deepak Mishra", "Ritu Thakur", "Karan Patel", "Sneha Das",
    "Aryan Rao", "Kabir Khan", "Abhimanyu Jha", "Tanish Roy", "Zoya Sheikh", "Ayesha Siddiqui", "Mehak Gill", "Tanvi Joshi", "Ridhi Bhatt", "Navya Nair",
    "Pranav Pillai", "Gautam Iyer", "Siddharth Hegde", "Varun Reddy", "Karthik Menon", "Nishant Bose", "Joy Chatterjee", "Suman Mukerjee", "Aritra Sen", "Pallab Nag"
];

window.generateLeaderboard = (classNum, totalMarks = 100, currentUser = null, userMarks = null) => {
    let dummyData = [];
    let startIndex = (classNum - 9) * 50; 
    let classSpecificNames = allNames.slice(startIndex, startIndex + 50);

    const displayCount = Math.floor(Math.random() * (50 - 45 + 1)) + 45;
    const finalNames = classSpecificNames.slice(0, displayCount);

    finalNames.forEach((name) => {
        let minPercent = 0.50; 
        let maxPercent = 0.95; 
        let randomPercent = Math.random() * (maxPercent - minPercent) + minPercent;
        let botScore = Math.floor(randomPercent * totalMarks);

        if (botScore >= totalMarks) botScore = totalMarks - 1;

        dummyData.push({
            name: name,
            marks: botScore,
            total: totalMarks,
            percentage: ((botScore / totalMarks) * 100).toFixed(1),
            isBot: true
        });
    });

    if (currentUser) {
        dummyData.push({
            name: currentUser.name + " (You)",
            marks: userMarks || 0,
            total: totalMarks,
            percentage: userMarks ? ((userMarks / totalMarks) * 100).toFixed(1) : 0,
            isBot: false
        });
    }

    return dummyData.sort((a, b) => b.marks - a.marks);
};