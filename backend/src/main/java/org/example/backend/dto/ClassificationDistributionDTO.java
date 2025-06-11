package org.example.backend.dto;

public class ClassificationDistributionDTO {

    private long norm;
    private long mi;
    private long sttc;
    private long cd;
    private long hyp;

    public ClassificationDistributionDTO() {}

    public ClassificationDistributionDTO(long norm, long mi, long sttc, long cd, long hyp) {
        this.norm = norm;
        this.mi = mi;
        this.sttc = sttc;
        this.cd = cd;
        this.hyp = hyp;
    }

    public long getNorm() {
        return norm;
    }

    public void setNorm(long norm) {
        this.norm = norm;
    }

    public long getMi() {
        return mi;
    }

    public void setMi(long mi) {
        this.mi = mi;
    }

    public long getSttc() {
        return sttc;
    }

    public void setSttc(long sttc) {
        this.sttc = sttc;
    }

    public long getCd() {
        return cd;
    }

    public void setCd(long cd) {
        this.cd = cd;
    }

    public long getHyp() {
        return hyp;
    }

    public void setHyp(long hyp) {
        this.hyp = hyp;
    }
}