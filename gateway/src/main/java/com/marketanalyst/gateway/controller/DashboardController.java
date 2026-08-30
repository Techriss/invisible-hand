package com.marketanalyst.gateway.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import com.marketanalyst.gateway.dto.AnalysisResponse;
import com.marketanalyst.gateway.dto.MacroResponse;
import com.marketanalyst.gateway.service.AiAnalysisService;
import com.marketanalyst.gateway.service.MacroService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class DashboardController {

    private static final Logger log = LoggerFactory.getLogger(DashboardController.class);

    private final AiAnalysisService aiService;
    private final MacroService macroService;

    public DashboardController(AiAnalysisService aiService, MacroService macroService) {
        this.aiService = aiService;
        this.macroService = macroService;
    }

    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        return Map.of("status", "UP");
    }

    @GetMapping("/analyze")
    public AnalysisResponse analyzeStock(@RequestParam String ticker) {
        log.info("Browser requested Deep Analysis for: {}", ticker);
        return aiService.fetchReportFromPython(ticker);
    }

    @GetMapping("/macro")
    public MacroResponse getMacroOverview() {
        log.info("Browser requested Morning Coffee Macro Overview");
        return macroService.fetchMacroSentiment();
    }
}