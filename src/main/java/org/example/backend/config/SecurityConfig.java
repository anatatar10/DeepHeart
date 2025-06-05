import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
            .csrf().disable()
            .formLogin().disable() // 🛡️ disable default login page
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/ecg/upload").permitAll()
                    .anyRequest().authenticated()
            )
            .httpBasic(); // optional — disable if not using basic auth

    return http.build();
}
