package com.marketanalyst.gateway.dto;

import java.util.List;

public record AnalysisResponse(
        String ticker,
        String executiveSummary,
        String bullCase,
        String bearCase,
        List<Risk> keyRisks,
        List<Opportunity> keyOpportunities,
        List<String> sources,
        double hypeIndex,
        double grahamNumber,
        double marginOfSafety,
        double altmanZScore,
        String altmanZStatus
) {
    public record Risk(String description, double severityScore, String timestamp) {}

    public record Opportunity(String description, double convictionScore, String timeframe) {}
}