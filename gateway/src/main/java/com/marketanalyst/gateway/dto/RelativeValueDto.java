package com.marketanalyst.gateway.dto;

import java.util.List;

public record RelativeValueDto(
        String targetTicker,
        String targetName,
        int clusterId,
        String themeName,
        double clusterAverageReturn,
        List<PeerDto> outperformers,
        List<PeerDto> laggards
) {}