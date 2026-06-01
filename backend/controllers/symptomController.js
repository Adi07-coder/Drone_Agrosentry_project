const SymptomHistory = require("../models/SymptomHistory");
const ActivityLog = require("../models/ActivityLog");
// const geminiDetection = require("../gemini/geminiDetection");

exports.diagnoseSymptoms = async (req, res, next) => {
  try {
    let { symptoms, symptomsText, additionalNotes = "" } = req.body;
    const userId = req.user?.id;

    if (symptomsText && (!symptoms || symptoms.length === 0)) {
      symptoms = [symptomsText];
    }

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one symptom"
      });
    }

    const symptomRules = [
      {
        keywords: ['brown spots', 'yellow leaves', 'browning edges'],
        disease: 'Early Blight',
        severity: 'High',
        recommendation: 'A fungal infection (Alternaria) commonly affecting tomatoes and potatoes.',
        treatment: 'Apply copper-based fungicides or chlorothalonil. Remove infected lower leaves immediately.',
        fertilizer: 'Avoid excess nitrogen. Use balanced 10-10-10 or slightly higher phosphorus to encourage root strength.',
        fertilizerQuantity: 'Apply 1-2 tbsp per plant bi-weekly',
        wateringAdvice: 'Water at the base early in the morning to allow leaves to dry.',
        prevention: 'Practice crop rotation and ensure wide plant spacing for airflow.'
      },
      {
        keywords: ['curling leaves', 'yellow leaves', 'stunted growth'],
        disease: 'Yellow Leaf Curl Virus',
        severity: 'High',
        recommendation: 'A viral disease transmitted by whiteflies causing severe stunting and leaf curling.',
        treatment: 'There is no cure for the virus. Infected plants must be uprooted and destroyed immediately.',
        fertilizer: 'Standard balanced fertilizer for remaining healthy plants to reduce stress.',
        fertilizerQuantity: 'Normal dosage',
        wateringAdvice: 'Maintain regular watering to prevent drought stress, which exacerbates symptoms.',
        prevention: 'Use insecticidal soaps to control whitefly populations and plant resistant varieties.'
      },
      {
        keywords: ['powdery coating', 'curling leaves', 'white spots'],
        disease: 'Powdery Mildew',
        severity: 'Low',
        recommendation: 'A fungal disease that thrives in high humidity and poor airflow, leaving white powder on leaves.',
        treatment: 'Spray with neem oil, potassium bicarbonate, or sulfur-based fungicides.',
        fertilizer: 'Avoid high-nitrogen fertilizers which push succulent new growth that fungi love.',
        fertilizerQuantity: 'Reduce normal dosage by half',
        wateringAdvice: 'Avoid overhead watering. Keep foliage dry.',
        prevention: 'Prune overcrowded branches to improve ventilation.'
      },
      {
        keywords: ['wilting', 'brown spots', 'drooping'],
        disease: 'Bacterial Wilt',
        severity: 'High',
        recommendation: 'A bacterial infection blocking the vascular tissue or causing localized cell death.',
        treatment: 'Apply copper-based bactericide. If severe wilting occurs, remove and destroy the plant.',
        fertilizer: 'Avoid excess nitrogen until recovered.',
        fertilizerQuantity: 'N/A',
        wateringAdvice: 'Water at the base of the plant to keep leaves dry.',
        prevention: 'Ensure adequate spacing and sanitize tools after use.'
      },
      {
        keywords: ['black spots', 'yellow halos'],
        disease: 'Bacterial Spot',
        severity: 'High',
        recommendation: 'A destructive bacterial disease that creates dark spots with distinct yellow halos.',
        treatment: 'Use copper fungicides mixed with mancozeb. Severely infected plants should be removed.',
        fertilizer: 'Standard balanced feeding; do not over-fertilize as it can encourage susceptible rapid growth.',
        fertilizerQuantity: 'Normal dosage',
        wateringAdvice: 'Avoid overhead irrigation entirely. Splashing water spreads the bacteria.',
        prevention: 'Use disease-free seeds and avoid working with wet plants.'
      },
      {
        keywords: ['leaf holes', 'stunted growth'],
        disease: 'Pest Infestation (Caterpillars/Beetles)',
        severity: 'Medium',
        recommendation: 'Insects are actively feeding on the plant foliage.',
        treatment: 'Use Bacillus thuringiensis (Bt) for caterpillars or insecticidal soap for soft-bodied insects.',
        fertilizer: 'Standard balanced fertilizer to help the plant recover lost foliage.',
        fertilizerQuantity: 'Normal dosage',
        wateringAdvice: 'Maintain regular watering schedule.',
        prevention: 'Inspect plants weekly; introduce beneficial insects like ladybugs.'
      },
      {
        keywords: ['webbing', 'yellow leaves', 'stunted growth'],
        disease: 'Spider Mites',
        severity: 'Medium',
        recommendation: 'Microscopic pests that drain plant sap, leaving tiny yellow stippling and fine webs.',
        treatment: 'Apply horticultural oil or insecticidal soap. Ensure thorough coverage under leaves.',
        fertilizer: 'Reduce fertilization until the infestation is controlled to avoid stressing the plant.',
        fertilizerQuantity: 'Pause feeding',
        wateringAdvice: 'Mites thrive in dry conditions. Misting plants can deter them.',
        prevention: 'Keep humidity at moderate levels and avoid prolonged drought stress.'
      },
      {
        keywords: ['foul odor', 'wilting', 'drooping'],
        disease: 'Soft Rot',
        severity: 'High',
        recommendation: 'A rapidly progressing bacterial infection that turns plant tissue to mush and smells foul.',
        treatment: 'No cure. Remove and destroy the infected plant immediately to save nearby plants.',
        fertilizer: 'Do not fertilize infected plants.',
        fertilizerQuantity: 'None',
        wateringAdvice: 'Stop watering immediately in the affected area.',
        prevention: 'Ensure excellent soil drainage and avoid mechanical injury to stems/roots.'
      },
      {
        keywords: ['browning edges', 'yellow leaves'],
        disease: 'Nutrient Deficiency (Potassium)',
        severity: 'Low',
        recommendation: 'The plant lacks essential potassium, often showing as burnt or brown edges on older leaves.',
        treatment: 'Amend the soil with a potassium-rich supplement like kelp meal or potash.',
        fertilizer: 'High-potassium fertilizer (e.g., 5-10-15 NPK).',
        fertilizerQuantity: '1-2 tbsp per gallon of soil',
        wateringAdvice: 'Maintain even moisture to help nutrient uptake.',
        prevention: 'Test soil annually and use a complete balanced fertilizer.'
      },
      {
        keywords: ['yellow leaves', 'stunted growth'],
        disease: 'Nutrient Deficiency (Nitrogen)',
        severity: 'Low',
        recommendation: 'The plant lacks essential nutrients for chlorophyll production, leading to generalized yellowing.',
        treatment: 'No pesticides needed. Adjust soil pH to 6.0-7.0 to ensure nutrient availability.',
        fertilizer: 'Nitrogen-rich fertilizer (e.g., Blood meal or 10-5-5 NPK).',
        fertilizerQuantity: '2 tbsp per gallon of soil',
        wateringAdvice: 'Water moderately, ensure good drainage.',
        prevention: 'Apply balanced fertilizer regularly during the growing season.'
      }
    ];

    const symptomsLower = symptoms.map(s => s.toLowerCase());
    let evaluatedRules = [];

    for (const rule of symptomRules) {
      const currentMatches = rule.keywords.filter(k => 
        symptomsLower.some(s => s.includes(k) || k.includes(s))
      );
      
      if (currentMatches.length > 0) {
        let matchRatio = currentMatches.length / rule.keywords.length;
        let conf = Math.round(50 + (matchRatio * 45));
        
        if (currentMatches.length === symptoms.length && symptoms.length > 1) {
            conf = Math.min(98, conf + 10);
        }

        evaluatedRules.push({
          diseaseName: rule.disease,
          confidence: Math.min(98, conf),
          severity: rule.severity,
          recommendation: rule.recommendation,
          treatment: rule.treatment,
          fertilizer: rule.fertilizer,
          fertilizerQuantity: rule.fertilizerQuantity,
          wateringAdvice: rule.wateringAdvice,
          prevention: rule.prevention,
          symptomsMatched: currentMatches
        });
      }
    }

    evaluatedRules.sort((a, b) => b.confidence - a.confidence);

    if (evaluatedRules.length === 0) {
      evaluatedRules.push({
        diseaseName: 'Unknown Plant Stress',
        confidence: 50,
        severity: 'Unknown',
        recommendation: 'The symptoms do not strongly match a specific disease in our local database. It may be general environmental stress or an unlisted disease.',
        treatment: 'Isolate the plant if possible. Do not apply harsh chemicals without a firm diagnosis.',
        fertilizer: 'Mild balanced fertilizer to avoid chemical burn.',
        fertilizerQuantity: 'Half-strength dosage',
        wateringAdvice: 'Check soil moisture before watering.',
        prevention: 'Monitor plant daily for changes.',
        symptomsMatched: symptoms
      });
    }

    const topDiagnoses = evaluatedRules.slice(0, 3);
    const topMatch = topDiagnoses[0];
    const additionalMatches = topDiagnoses.slice(1).map(d => ({
      ...d,
      fertilizer: `${d.fertilizer} (Quantity: ${d.fertilizerQuantity})`
    }));

    // Save to database with new structured fields
    const savedSymptom = await SymptomHistory.create({
      userId,
      symptoms,
      additionalNotes,
      diseaseName: topMatch.diseaseName,
      confidence: topMatch.confidence,
      severity: topMatch.severity,
      recommendation: topMatch.recommendation,
      treatment: topMatch.treatment,
      fertilizer: `${topMatch.fertilizer} (Quantity: ${topMatch.fertilizerQuantity})`,
      prevention: topMatch.prevention,
      symptomsMatched: topMatch.symptomsMatched,
      additionalDiagnoses: additionalMatches,
      createdAt: new Date()
    });

    if (userId) {
      await ActivityLog.create({
        userId,
        action: "symptom_diagnosis",
        description: `Symptom-based diagnosis: ${topMatch.diseaseName}`,
        status: "success",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        metadata: {
          confidence: topMatch.confidence,
          symptomHistoryId: savedSymptom._id
        }
      });
    }

    res.status(200).json({
      success: true,
      diagnoses: topDiagnoses,
      historyRecord: savedSymptom
    });

  } catch (error) {
    next(error);
  }
};

exports.getSymptomHistory = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    const history = await SymptomHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SymptomHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      history,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      }
    });
  } catch (error) {
    next(error);
  }
};
