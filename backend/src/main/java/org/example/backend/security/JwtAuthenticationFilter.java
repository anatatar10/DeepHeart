package org.example.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// DO NOT add @Component here
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    // Keep this constructor
    public JwtAuthenticationFilter(JwtUtils jwtUtils, UserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        System.out.println("🔍 JWT Filter - Processing request: " + requestURI);

        try {
            String jwt = parseJwt(request);
            System.out.println("🔍 JWT Filter - JWT token: " + (jwt != null ? jwt.substring(0, Math.min(jwt.length(), 20)) + "..." : "null"));

            if (jwt != null) {
                System.out.println("🔍 JWT Filter - Validating token...");
                boolean isValid = jwtUtils.validateJwtToken(jwt);
                System.out.println("🔍 JWT Filter - Token validation result: " + isValid);

                if (isValid) {
                    String username = jwtUtils.getUsernameFromJwtToken(jwt);
                    System.out.println("🔍 JWT Filter - Extracted username: " + username);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    System.out.println("🔍 JWT Filter - Loaded user details for: " + userDetails.getUsername());

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("✅ JWT Filter - Authentication set successfully for: " + username);
                } else {
                    System.err.println("❌ JWT Filter - Token validation failed");
                }
            } else {
                System.out.println("❌ JWT Filter - No JWT token found in request");

                // Log the authorization header for debugging
                String authHeader = request.getHeader("Authorization");
                System.out.println("🔍 JWT Filter - Authorization header: " +
                        (authHeader != null ? authHeader.substring(0, Math.min(authHeader.length(), 30)) + "..." : "null"));
            }
        } catch (Exception e) {
            System.err.println("❌ JWT Filter - Error processing token: " + e.getMessage());
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        System.out.println("🔍 JWT Filter - parseJwt - Raw Authorization header: " +
                (headerAuth != null ? headerAuth.substring(0, Math.min(headerAuth.length(), 50)) + "..." : "null"));

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String token = headerAuth.substring(7);
            System.out.println("🔍 JWT Filter - parseJwt - Extracted token length: " + token.length());
            return token;
        }

        System.out.println("❌ JWT Filter - parseJwt - No valid Bearer token found");
        return null;
    }
}