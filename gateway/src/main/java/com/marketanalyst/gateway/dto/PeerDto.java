package com.marketanalyst.gateway.dto;

public record PeerDto(
        String ticker,
        String companyName,
        double performanceSpread
) {}
