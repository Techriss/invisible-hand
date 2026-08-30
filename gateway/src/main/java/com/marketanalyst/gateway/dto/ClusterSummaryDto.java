package com.marketanalyst.gateway.dto;

import java.util.List;

public record ClusterSummaryDto(
        int clusterId,
        String themeName,
        String description,
        int constituentCount,
        double averageMomentum,
        List<String> topTickers
) {}
