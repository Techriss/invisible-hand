package com.marketanalyst.gateway.service;

import com.marketanalyst.grpc.RotationAlert;
import com.marketanalyst.grpc.SectorRotationMonitorGrpc;
import com.marketanalyst.grpc.SectorSubscription;

import io.grpc.Context;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import io.grpc.ManagedChannel;

@Service
public class SectorStreamService {

    private final SectorRotationMonitorGrpc.SectorRotationMonitorBlockingStub stub;

    private final ExecutorService backgroundWorker = Executors.newCachedThreadPool();
    
    public SectorStreamService(ManagedChannel channel) {
        this.stub = SectorRotationMonitorGrpc.newBlockingStub(channel);
    }

    public SseEmitter streamToBrowser(String sector) {
        SseEmitter browserPipe = new SseEmitter(-1L);

        Context.CancellableContext grpcContext = Context.current().withCancellation();

        Runnable killStream = () -> grpcContext.cancel(new RuntimeException("Browser disconnected"));
        browserPipe.onCompletion(killStream);
        browserPipe.onTimeout(killStream);
        browserPipe.onError(e -> killStream.run());

        backgroundWorker.execute(() -> {
            grpcContext.run(() -> {
                try {
                    SectorSubscription request = SectorSubscription.newBuilder()
                            .setUrgencyLevel("HIGH")
                            .build();

                    record SectorPayload(String name, double size, double momentum) {}

                    Iterator<RotationAlert> pythonStream = stub.subscribeToSector(request);

                    while (pythonStream.hasNext()) {
                        RotationAlert alert = pythonStream.next();
                        
                        var sectors = alert.getSectorsList().stream()
                            .map(s -> new SectorPayload(s.getName(), s.getSize(), s.getMomentum()))
                            .toList();

                        browserPipe.send(SseEmitter.event().name("rotation").data(sectors));
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