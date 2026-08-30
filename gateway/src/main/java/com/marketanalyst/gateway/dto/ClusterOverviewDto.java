package com.marketanalyst.gateway.dto;

import java.util.List;

public record ClusterOverviewDto(
        List<ClusterSummaryDto> clusters
) {}
