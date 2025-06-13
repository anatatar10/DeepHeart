
package org.example.backend.repository;

import org.assertj.core.api.Assertions;
import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void testSaveAndFindById() {
        User user = new User();
        user.setEmail("john.doe@example.com");
        user.setUsername("johndoe");
        user.setPassword("password");
        user.setName("John Doe");
        user.setRole(Role.PATIENT);

        User savedUser = userRepository.save(user);
        Optional<User> foundUser = userRepository.findById(savedUser.getId());

        Assertions.assertThat(foundUser).isPresent();
        Assertions.assertThat(foundUser.get().getEmail()).isEqualTo("john.doe@example.com");
    }

    @Test
    void testFindByEmail() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setUsername("testuser");
        user.setPassword("pass");
        user.setName("Test User");
        user.setRole(Role.DOCTOR);

        userRepository.save(user);

        Optional<User> found = userRepository.findByEmail("test@example.com");
        Assertions.assertThat(found).isPresent();
        Assertions.assertThat(found.get().getUsername()).isEqualTo("testuser");
    }
}