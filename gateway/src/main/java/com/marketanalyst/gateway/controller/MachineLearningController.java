package com.marketanalyst.gateway.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.marketanalyst.gateway.dto.ClusterOverviewDto;
import com.marketanalyst.gateway.dto.RelativeValueDto;
import com.marketanalyst.gateway.service.MachineLearningService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ml")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class MachineLearningController {

    private static final Logger log = LoggerFactory.getLogger(MachineLearningController.class);

    private final MachineLearningService mlService;

    public MachineLearningController(MachineLearningService mlService) {
        this.mlService = mlService;
    }

    @GetMapping("/clusters")
    public ClusterOverviewDto getMacroClusters() {
        log.info("Browser requested ML Cluster Overview");
        return mlService.getMacroClusters();
    }

    @GetMapping("/relative-value")
    public RelativeValueDto getRelativeValue(@RequestParam String ticker) {
        log.info("Browser requested Relative Value Divergence for: {}", ticker);
        return mlService.getRelativeValue(ticker);
    }
}