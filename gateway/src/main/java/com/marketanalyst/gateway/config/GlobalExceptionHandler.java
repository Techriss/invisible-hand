package com.marketanalyst.gateway.config;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import io.grpc.StatusRuntimeException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(StatusRuntimeException.class)
    public void handleGrpcCancel(StatusRuntimeException e) {
        if (e.getStatus().getCode() == io.grpc.Status.Code.CANCELLED) {
        } else {
            throw e;
        }
    }
}