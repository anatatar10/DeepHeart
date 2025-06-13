package org.example.backend.config;

import org.example.backend.model.Role;
import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
public class TestDataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        addAdmin();
        addMissingDoctors();

    }

    private void addAdmin() {
        String adminEmail = "admin@admin.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setName("System Administrator");
            admin.setPhone("+1-555-0000");
            admin.setBirthdate(LocalDate.of(1990, 1, 1));
            admin.setGender("Male");
            admin.setRegistrationDate(LocalDate.now());

            userRepository.save(admin);
            System.out.println("✅ Admin user created: " + adminEmail);
        } else {
            System.out.println("⚠️ Admin user already exists: " + adminEmail);
        }
    }

    private void addMissingDoctors() {
        System.out.println("🔍 Checking for missing doctors...");

        // List of additional doctors to add
        List<DoctorData> additionalDoctors = Arrays.asList(
                new DoctorData("Dr. Amanda Roberts", "a.roberts@medcenter.com", "Dermatology"),
                new DoctorData("Dr. Kevin Patel", "k.patel@healthsystem.org", "Orthopedics"),
                new DoctorData("Dr. Rachel Turner", "r.turner@clinic.net", "Psychiatry"),
                new DoctorData("Dr. Mark Davis", "mark.davis@wellness.com", "Gastroenterology"),
                new DoctorData("Dr. Jennifer Lee", "j.lee@medicalplex.org", "Oncology"),
                new DoctorData("Dr. Christopher Moore", "c.moore@healthpartners.com", "Pulmonology"),
                new DoctorData("Dr. Angela Wright", "angela.wright@familymed.org", "Family Medicine"),
                new DoctorData("Dr. Robert Kim", "robert.kim@surgicalcenter.com", "General Surgery")
        );

        int addedCount = 0;
        for (DoctorData doctorData : additionalDoctors) {
            if (!userRepository.existsByEmail(doctorData.email)) {
                User doctor = createDoctor(doctorData.name, doctorData.email, doctorData.department);
                if (doctor != null) {
                    addPatientsForDoctor(doctor, doctorData.department);
                    addedCount++;
                }
            } else {
                System.out.println("⚠️ Doctor already exists: " + doctorData.email);
            }
        }

        if (addedCount > 0) {
            System.out.println("✅ Added " + addedCount + " new doctors with their patients!");
            printUpdatedStats();
        } else {
            System.out.println("✅ All additional doctors already exist in database.");
        }
    }

    private User createDoctor(String name, String email, String department) {
        String username = email.split("@")[0];
        User doctor = new User(
                username,
                email,
                passwordEncoder.encode("doctor123"), // Should be hashed in real implementation
                Role.DOCTOR,
                name,
                "+1-555-" + String.format("%04d", (int)(Math.random() * 9999)),
                LocalDate.of(1975 + (int)(Math.random() * 15), 1 + (int)(Math.random() * 12), 1 + (int)(Math.random() * 28)),
                Math.random() > 0.5 ? "Female" : "Male"
        );
        doctor.setRegistrationDate(LocalDate.of(2015 + (int)(Math.random() * 8), 1 + (int)(Math.random() * 12), 1 + (int)(Math.random() * 28)));
        doctor = userRepository.save(doctor);
        System.out.println("✅ Created doctor: " + name + " (" + department + ")");
        return doctor;
    }

    private void addPatientsForDoctor(User doctor, String department) {
        List<PatientData> patients = getPatientsForDepartment(department);

        System.out.println("👥 Creating patients for " + doctor.getName() + ":");

        for (PatientData patientData : patients) {
            if (!userRepository.existsByEmail(patientData.email)) {
                User patient = new User(
                        patientData.email.split("@")[0],
                        patientData.email,
                        passwordEncoder.encode("patient123"), // Hash the password
                        Role.PATIENT,
                        patientData.name,
                        patientData.phone,
                        patientData.birthdate,
                        patientData.gender
                );

                patient.setDoctor(doctor);
                patient.setSmokingStatus(patientData.smokingStatus);
                patient.setBloodPressure(patientData.bloodPressure);
                patient.setMedicalHistory(patientData.medicalHistory);
                patient.setRegistrationDate(LocalDate.of(2023 + (int)(Math.random() * 2), 1 + (int)(Math.random() * 12), 1 + (int)(Math.random() * 28)));

                userRepository.save(patient);
                System.out.println("   ✅ " + patientData.name);
            }
        }
    }

    private List<PatientData> getPatientsForDepartment(String department) {
        switch (department) {
            case "Dermatology":
                return Arrays.asList(
                        new PatientData("Jennifer Adams", "jennifer.adams@gmail.com", "+1-555-0701",
                                LocalDate.of(1988, 3, 14), "Female", "Never smoked", "115/70",
                                Arrays.asList("Acne", "Eczema")),
                        new PatientData("Thomas Baker", "thomas.baker@outlook.com", "+1-555-0702",
                                LocalDate.of(1976, 9, 21), "Male", "Former smoker", "128/82",
                                Arrays.asList("Psoriasis", "Skin Cancer History")),
                        new PatientData("Sarah Mitchell", "sarah.mitchell@hotmail.com", "+1-555-0703",
                                LocalDate.of(1992, 12, 8), "Female", "Never smoked", "110/68",
                                Arrays.asList("Rosacea", "Sun Damage")),
                        new PatientData("David Parker", "david.parker@yahoo.com", "+1-555-0704",
                                LocalDate.of(1985, 6, 17), "Male", "Never smoked", "125/78",
                                Arrays.asList("Dermatitis", "Hair Loss"))
                );
            case "Orthopedics":
                return Arrays.asList(
                        new PatientData("Maria Gonzalez", "maria.gonzalez@gmail.com", "+1-555-0801",
                                LocalDate.of(1971, 4, 25), "Female", "Never smoked", "132/84",
                                Arrays.asList("Arthritis", "Previous Knee Surgery")),
                        new PatientData("Andrew Collins", "andrew.collins@icloud.com", "+1-555-0802",
                                LocalDate.of(1989, 11, 12), "Male", "Never smoked", "118/76",
                                Arrays.asList("Sports Injury", "ACL Tear")),
                        new PatientData("Jessica Turner", "jessica.turner@protonmail.com", "+1-555-0803",
                                LocalDate.of(1966, 8, 3), "Female", "Former smoker", "145/88",
                                Arrays.asList("Osteoporosis", "Back Pain")),
                        new PatientData("Daniel Stewart", "daniel.stewart@gmail.com", "+1-555-0804",
                                LocalDate.of(1980, 1, 19), "Male", "Current smoker", "138/85",
                                Arrays.asList("Fracture History", "Joint Pain"))
                );
            case "Psychiatry":
                return Arrays.asList(
                        new PatientData("Amanda Foster", "amanda.foster@outlook.com", "+1-555-0901",
                                LocalDate.of(1990, 7, 11), "Female", "Never smoked", "120/75",
                                Arrays.asList("Depression", "Anxiety Disorder")),
                        new PatientData("Ryan Cooper", "ryan.cooper@gmail.com", "+1-555-0902",
                                LocalDate.of(1982, 2, 28), "Male", "Former smoker", "135/82",
                                Arrays.asList("PTSD", "Sleep Disorder")),
                        new PatientData("Nicole Reed", "nicole.reed@yahoo.com", "+1-555-0903",
                                LocalDate.of(1975, 10, 16), "Female", "Never smoked", "112/70",
                                Arrays.asList("Bipolar Disorder", "Eating Disorder History")),
                        new PatientData("Brandon Kelly", "brandon.kelly@hotmail.com", "+1-555-0904",
                                LocalDate.of(1987, 5, 7), "Male", "Current smoker", "142/89",
                                Arrays.asList("ADHD", "Substance Abuse History"))
                );
            case "Gastroenterology":
                return Arrays.asList(
                        new PatientData("Catherine Murphy", "catherine.murphy@gmail.com", "+1-555-1001",
                                LocalDate.of(1963, 9, 4), "Female", "Never smoked", "148/92",
                                Arrays.asList("Crohn's Disease", "IBS")),
                        new PatientData("Gregory Price", "gregory.price@icloud.com", "+1-555-1002",
                                LocalDate.of(1978, 12, 22), "Male", "Former smoker", "155/95",
                                Arrays.asList("Ulcerative Colitis", "GERD")),
                        new PatientData("Stephanie Ross", "stephanie.ross@protonmail.com", "+1-555-1003",
                                LocalDate.of(1984, 3, 15), "Female", "Never smoked", "125/80",
                                Arrays.asList("Celiac Disease", "Gastroparesis")),
                        new PatientData("Kenneth Ward", "kenneth.ward@outlook.com", "+1-555-1004",
                                LocalDate.of(1969, 6, 29), "Male", "Current smoker", "162/98",
                                Arrays.asList("Liver Disease", "Gallstones"))
                );
            case "Oncology":
                return Arrays.asList(
                        new PatientData("Diana Torres", "diana.torres@gmail.com", "+1-555-1101",
                                LocalDate.of(1958, 11, 8), "Female", "Former smoker", "140/88",
                                Arrays.asList("Breast Cancer Survivor", "Lymphedema")),
                        new PatientData("Frank Peterson", "frank.peterson@yahoo.com", "+1-555-1102",
                                LocalDate.of(1972, 4, 13), "Male", "Never smoked", "132/85",
                                Arrays.asList("Prostate Cancer Treatment", "Fatigue")),
                        new PatientData("Lisa Howard", "lisa.howard@hotmail.com", "+1-555-1103",
                                LocalDate.of(1965, 8, 27), "Female", "Never smoked", "138/82",
                                Arrays.asList("Ovarian Cancer History", "Neuropathy")),
                        new PatientData("Charles Rivera", "charles.rivera@icloud.com", "+1-555-1104",
                                LocalDate.of(1951, 1, 9), "Male", "Former smoker", "158/94",
                                Arrays.asList("Lung Cancer Treatment", "Respiratory Issues"))
                );
            case "Pulmonology":
                return Arrays.asList(
                        new PatientData("Rachel Hughes", "rachel.hughes@gmail.com", "+1-555-1201",
                                LocalDate.of(1979, 7, 24), "Female", "Never smoked", "125/78",
                                Arrays.asList("Asthma", "Allergic Rhinitis")),
                        new PatientData("Scott Watson", "scott.watson@outlook.com", "+1-555-1202",
                                LocalDate.of(1962, 10, 11), "Male", "Current smoker", "165/100",
                                Arrays.asList("COPD", "Emphysema")),
                        new PatientData("Laura Brooks", "laura.brooks@protonmail.com", "+1-555-1203",
                                LocalDate.of(1986, 2, 18), "Female", "Never smoked", "118/72",
                                Arrays.asList("Pulmonary Fibrosis", "Sleep Apnea")),
                        new PatientData("Jeffrey Gray", "jeffrey.gray@yahoo.com", "+1-555-1204",
                                LocalDate.of(1974, 5, 6), "Male", "Former smoker", "148/90",
                                Arrays.asList("Pneumonia History", "Chronic Bronchitis"))
                );
            case "Family Medicine":
                return Arrays.asList(
                        new PatientData("Michelle Cox", "michelle.cox@gmail.com", "+1-555-1301",
                                LocalDate.of(1983, 9, 19), "Female", "Never smoked", "122/76",
                                Arrays.asList("General Health Check", "Vaccination Updates")),
                        new PatientData("Jason Ward", "jason.ward@hotmail.com", "+1-555-1302",
                                LocalDate.of(1977, 12, 31), "Male", "Never smoked", "130/80",
                                Arrays.asList("Routine Physical", "High Cholesterol")),
                        new PatientData("Kimberly Bell", "kimberly.bell@icloud.com", "+1-555-1303",
                                LocalDate.of(1991, 6, 8), "Female", "Never smoked", "115/70",
                                Arrays.asList("Preventive Care", "Family Planning")),
                        new PatientData("Joseph Richardson", "joseph.richardson@outlook.com", "+1-555-1304",
                                LocalDate.of(2010, 3, 26), "Male", "N/A", "105/65",
                                Arrays.asList("Pediatric Care", "Growth Monitoring")),
                        new PatientData("Karen Phillips", "karen.phillips@protonmail.com", "+1-555-1305",
                                LocalDate.of(1955, 8, 14), "Female", "Former smoker", "152/95",
                                Arrays.asList("Geriatric Care", "Multiple Medications"))
                );
            case "General Surgery":
                return Arrays.asList(
                        new PatientData("Brian Evans", "brian.evans@gmail.com", "+1-555-1401",
                                LocalDate.of(1968, 4, 5), "Male", "Current smoker", "145/92",
                                Arrays.asList("Gallbladder Surgery", "Hernia")),
                        new PatientData("Christine Powell", "christine.powell@yahoo.com", "+1-555-1402",
                                LocalDate.of(1981, 11, 17), "Female", "Never smoked", "128/82",
                                Arrays.asList("Appendectomy", "Post-op Recovery")),
                        new PatientData("Timothy Long", "timothy.long@hotmail.com", "+1-555-1403",
                                LocalDate.of(1973, 7, 29), "Male", "Former smoker", "138/88",
                                Arrays.asList("Colon Surgery", "IBD")),
                        new PatientData("Sharon Butler", "sharon.butler@icloud.com", "+1-555-1404",
                                LocalDate.of(1959, 2, 12), "Female", "Never smoked", "142/86",
                                Arrays.asList("Thyroid Surgery", "Nodules"))
                );
            default:
                return Arrays.asList();
        }
    }

    private void printUpdatedStats() {
        System.out.println("📊 Updated Database Statistics:");
        System.out.println("   Total users: " + userRepository.count());
        System.out.println("   Patients: " + userRepository.findByRole(Role.PATIENT).size());
        System.out.println("   Doctors: " + userRepository.findByRole(Role.DOCTOR).size());
        System.out.println("   Admins: " + userRepository.findByRole(Role.ADMIN).size());
    }

    // Helper classes
    private static class DoctorData {
        String name, email, department;

        DoctorData(String name, String email, String department) {
            this.name = name;
            this.email = email;
            this.department = department;
        }
    }

    private static class PatientData {
        String name, email, phone, gender, smokingStatus, bloodPressure;
        LocalDate birthdate;
        List<String> medicalHistory;

        PatientData(String name, String email, String phone, LocalDate birthdate, String gender,
                    String smokingStatus, String bloodPressure, List<String> medicalHistory) {
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.birthdate = birthdate;
            this.gender = gender;
            this.smokingStatus = smokingStatus;
            this.bloodPressure = bloodPressure;
            this.medicalHistory = medicalHistory;
        }
    }
}