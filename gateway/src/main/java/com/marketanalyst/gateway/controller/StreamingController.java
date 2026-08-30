package com.marketanalyst.gateway.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.marketanalyst.gateway.service.LiquidityService;
import com.marketanalyst.gateway.service.SectorStreamService;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class StreamingController {

    private static final Logger log = LoggerFactory.getLogger(StreamingController.class);

    private final SectorStreamService streamService;
    private final LiquidityService liquidityService;

    public StreamingController(SectorStreamService streamService, LiquidityService liquidityService) {
        this.streamService = streamService;
        this.liquidityService = liquidityService;
    }

    @GetMapping("/rotations")
    public SseEmitter streamRotations(@RequestParam String sector) {
        log.info("Browser subscribed to live Sector Rotations for: {}", sector);
        return streamService.streamToBrowser(sector);
    }

    @GetMapping("/liquidity")
    public SseEmitter streamLiquidity(@RequestParam(defaultValue = "SPY") String ticker) {
        log.info("Browser subscribed to live Alpaca Liquidity for: {}", ticker);
        return liquidityService.streamLiquidity(ticker);
    }
}