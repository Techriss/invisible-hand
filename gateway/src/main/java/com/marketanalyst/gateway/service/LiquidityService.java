package com.marketanalyst.gateway.service;

import com.marketanalyst.grpc.LiquidityRequest;
import com.marketanalyst.grpc.LiquiditySummary;
import com.marketanalyst.grpc.MacroLiquidityAnalyzerGrpc;
import io.grpc.Context;
import io.grpc.ManagedChannel;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class LiquidityService {

    private final MacroLiquidityAnalyzerGrpc.MacroLiquidityAnalyzerBlockingStub stub;

    private final ExecutorService backgroundWorker = Executors.newCachedThreadPool();

    public LiquidityService(ManagedChannel channel) {
        this.stub = MacroLiquidityAnalyzerGrpc.newBlockingStub(channel);
    }

    public SseEmitter streamLiquidity(String ticker) {
        SseEmitter browserPipe = new SseEmitter(-1L);

        Context.CancellableContext grpcContext = Context.current().withCancellation();

        Runnable killStream = () -> grpcContext.cancel(new RuntimeException("Browser disconnected"));
        browserPipe.onCompletion(killStream);
        browserPipe.onTimeout(killStream);
        browserPipe.onError(e -> killStream.run());

        backgroundWorker.execute(() -> {
            grpcContext.run(() -> {
                try {
                    LiquidityRequest request = LiquidityRequest.newBuilder()
                            .setTicker(ticker != null ? ticker : "SPY")
                            .build();

                    record LiquidityPayload(String score, String regime) {}

                    Iterator<LiquiditySummary> pythonStream = stub.subscribeToLiquidity(request);

                    while (pythonStream.hasNext()) {
                        LiquiditySummary summary = pythonStream.next();

                        String formattedScore = String.format("%.1f", summary.getLiquidityScore());
                        var payload = new LiquidityPayload(formattedScore, summary.getMarketRegime());

                        browserPipe.send(SseEmitter.event().name("liquidity").data(payload));
                    }

                    browserPipe.complete();

                } catch (io.grpc.StatusRuntimeException e) {
                    if (e.getStatus().getCode() == io.grpc.Status.Code.CANCELLED) {
                        
                    } else {
                        browserPipe.completeWithError(e);
                    }
                } catch (Exception e) {
                    browserPipe.completeWithError(e);
                }
            });
        });

        return browserPipe;
    }

}