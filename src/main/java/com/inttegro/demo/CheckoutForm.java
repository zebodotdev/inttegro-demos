package com.inttegro.demo;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CheckoutForm(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email String email,
        @NotBlank @Size(max = 40) String phone,
        @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{8,100}") String attemptId
) {}
