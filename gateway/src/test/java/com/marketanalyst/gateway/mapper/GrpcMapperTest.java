package com.marketanalyst.gateway.mapper;

import com.marketanalyst.gateway.dto.AnalysisResponse;
import com.marketanalyst.grpc.AnalysisReport;
import com.marketanalyst.grpc.RiskFactor;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GrpcMapperTest {

    @Test
    void testToAnalysisResponsePreventsDataLoss() {
        AnalysisReport grpcReport = AnalysisReport.newBuilder()
                .setTicker("NVDA")
                .setExecutiveSummary("Strong AI chip demand.")
                .setAltmanZStatus("SAFE")
                .addKeyRisks(RiskFactor.newBuilder()
                        .setRiskDescription("Supply chain constraints")
                        .setSeverityScore(8.0f)
                        .setTimestamp("2026-09-22")
                        .build())
                .build();

        AnalysisResponse dto = GrpcMapper.toAnalysisResponse(grpcReport);

        assertNotNull(dto);
        assertEquals("NVDA", dto.ticker());
        assertEquals("Strong AI chip demand.", dto.executiveSummary());
        assertEquals(1, dto.keyRisks().size());
        assertEquals("Supply chain constraints", dto.keyRisks().get(0).description());
    }
}