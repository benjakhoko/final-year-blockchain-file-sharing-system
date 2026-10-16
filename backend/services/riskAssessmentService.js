/**
 * Risk Assessment Service
 * 
 * Computes a composite risk score (0-100) for file access attempts based on:
 * - File classification risk (malicious file probability from ML model)
 * - Sharing anomaly risk (abnormal sharing probability from ML model)
 * - Access pattern risk (time-based, user download history, device tracking)
 * 
 * Returns risk level: 'low' (0-33), 'medium' (34-66), 'high' (67-100)
 */

const ActivityLog = require('../models/ActivityLog');

// Risk thresholds
const RISK_THRESHOLDS = {
    LOW: 33,
    MEDIUM: 66
};


/**
 * Compute access pattern risk based on user behavior


    const {
        accessTime,
        userDownloadCount,
        fileDownloadCount,
        isFirstAccess,
        isLateNightAccess
    } = accessContext;

    let score = 0;

    // Late night access (12am-5am) is suspicious
    if (isLateNightAccess) {
        score += 25;
    }

    // High download count from same user
    if (userDownloadCount > 50) {
        score += 20;
    } else if (userDownloadCount > 20) {
        score += 10;
    }

    // High file download count
    if (fileDownloadCount > 100) {
        score += 20;
    } else if (fileDownloadCount > 50) {
        score += 10;
    }

    // First access to a file in a long time
    if (isFirstAccess) {
        score += 20;
    }

    // Cap at 100
    const riskScore = Math.min(100, Math.round(score));


    let score = 0;

    // Check for unusual user agents (common in malicious tools)
    if (userAgent && (
        userAgent.includes('sqlmap') ||
        userAgent.includes('nikto') ||
        userAgent.includes('nessus') ||
        userAgent.includes('masscan') ||
        userAgent.includes('nmap') ||
        userAgent.includes('curl/') ||
        userAgent.includes('python-requests') ||
        userAgent.includes('Go-http-client') ||
        userAgent.includes('PostmanRuntime') ||
        userAgent.includes('wget/')
    )) {
        score += 40;
    }

    // Check for TOR exit nodes (if using geo-IP lookup)


    const {
        fileId,
        userId,
        fileStats,
        sharingStats,
        ipAddress,
        userAgent,
        accessTime,
        userDownloadCount,
        fileDownloadCount,
        isFirstAccess,
        deviceNew,
        sensitiveFile
    } = context;

    // Get ML predictions
    let fileClassification = null;

    const deviceRisk = computeDeviceRisk(userAgent, ipAddress, userId);

    const accessPatternRisk = computeAccessPatternRisk({
        accessTime,
        userDownloadCount,
        fileDownloadCount,
        isFirstAccess,
        isLateNightAccess: accessTime && (
            accessTime.getHours() < 5 || accessTime.getHours() > 22
        )
    });

    // Composite score: ML 40%, Device 30%, Access Pattern 30%
    const compositeScore = (
        mlRisk.riskScore * 0.4 +
        deviceRisk.riskScore * 0.3 +
        accessPatternRisk.riskScore * 0.3
    );

    const riskScore = Math.round(Math.min(100, compositeScore));
    const riskLevel = riskScore > RISK_THRESHOLDS.MEDIUM ? 'high' :
                      riskScore > RISK_THRESHOLDS.LOW ? 'medium' : 'low';

    // Log the risk assessment
    try {
        await ActivityLog.create({
            user: userId,
            action: 'RISK_ASSESSMENT',
            resourceType: 'file',
            resourceId: fileId,
            details: {
                mlRisk: mlRisk.riskScore,
                deviceRisk: deviceRisk.riskScore,
                accessPatternRisk: accessPatternRisk.riskScore,
                riskScore,
                riskLevel,
                ipAddress,
                userAgent: userAgent?.substring(0, 100)
            },
            status: 'success'
        });
    } catch (e) {
        console.error('Failed to log risk assessment:', e.message);
    }

    return {
        riskScore,
        riskLevel,
        breakdown: {
            ml: Math.round(mlRisk.riskScore),
            device: deviceRisk.riskScore,
            accessPattern: accessPatternRisk.riskScore
        }
    };
}

module.exports = {
    computeAccessRisk,
    RISK_THRESHOLDS
};
    let sharingAnomaly = null;

    try {
        if (fileStats) {
            fileClassification = await require('../services/mlService').classifyFile(fileStats);
        }
    } catch (e) {
        console.error('ML file classification failed:', e.message);
    }

    try {
        if (sharingStats) {
            sharingAnomaly = await require('../services/mlService').detectAbnormalSharing(sharingStats);
        }
    } catch (e) {
        console.error('ML sharing anomaly detection failed:', e.message);
    }

    // Compute component risks
    const mlRisk = computeRiskFromML({
async function computeAccessRisk(context) {
    // score += 30; // Would require geo-IP service

    // New IP/range in quick succession (tracked at access attempt level)
    // score += 25; // Would require IP tracking service

    const riskScore = Math.min(100, score);
    const riskLevel = riskScore > RISK_THRESHOLDS.MEDIUM ? 'high' :
                      riskScore > RISK_THRESHOLDS.LOW ? 'medium' : 'low';

    return {
        riskScore,
        riskLevel
    };
}
function computeDeviceRisk(userAgent, ipAddress, userEmail) {
    const riskLevel = riskScore > RISK_THRESHOLDS.MEDIUM ? 'high' :
                      riskScore > RISK_THRESHOLDS.LOW ? 'medium' : 'low';

    return {
        riskScore,
        riskLevel
    };
}
function computeAccessPatternRisk(accessContext) {
 */

/**
 * Compute risk score from ML predictions
 */
