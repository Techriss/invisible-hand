package com.marketanalyst.gateway.controller;

import com.marketanalyst.gateway.dto.AnalysisResponse;
import com.marketanalyst.gateway.service.AiAnalysisService;
import com.marketanalyst.gateway.service.MacroService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class DashboardControllerTest {

    @Test
    void testHealthCheckReturnsUp() {
        DashboardController controller = new DashboardController(null, null);

        Map<String, String> response = controller.healthCheck();
        assertEquals("UP", response.get("status"));
    }

    @Test
    void testAnalyzeEndpointRoutesCorrectly() {
        AiAnalysisService mockAiService = Mockito.mock(AiAnalysisService.class);
        MacroService mockMacroService = Mockito.mock(MacroService.class);

        AnalysisResponse mockResponse = new AnalysisResponse(
                "AAPL", "Strong AI demand.", "Bull", "Bear",
                Collections.emptyList(), Collections.emptyList(), Collections.emptyList(),
                0.5, 60.0, 0.2, 4.0, "SAFE"
        );
        Mockito.when(mockAiService.fetchReportFromPython("AAPL")).thenReturn(mockResponse);

        DashboardController controller = new DashboardController(mockAiService, mockMacroService);

        AnalysisResponse result = controller.analyzeStock("AAPL");

        assertNotNull(result);
        assertEquals("AAPL", result.ticker());
        assertEquals("Strong AI demand.", result.executiveSummary());
    }
}