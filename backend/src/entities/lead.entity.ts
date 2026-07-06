import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_name: string;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ nullable: true })
  website_url: string;

  @Column({ nullable: true })
  contact_number: string;

  @Column({ nullable: true })
  area_name: string;

  @Column({ nullable: true })
  search_area: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  institution_type: string;

  @Column({ nullable: true })
  appearance: string;

  @Column({ nullable: true })
  remarks: string;

  @Column({ nullable: true })
  atmosphere: string;

  @Column({ nullable: true })
  social_media: string;

  @Column({ nullable: true })
  google_rating: string;

  @Column({ nullable: true })
  photo_url: string;

  @Column({ default: 'New Lead' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
