"""
Management command: python manage.py seed_demo_data
Creates demo users, programs, academic year, students, fee types, fee records, and payments.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
import datetime


class Command(BaseCommand):
    help = 'Seeds the database with demo data'

    def handle(self, *args, **options):
        from apps.accounts.models import User
        from apps.students.models import AcademicYear, Program, Student
        from apps.fees.models import FeeType, FeeRecord, Payment

        self.stdout.write('🌱 Seeding demo data...')

        # ── Academic Year ────────────────────────────────────────────────────
        year, _ = AcademicYear.objects.get_or_create(
            name='2024-2025',
            defaults={
                'start_date': datetime.date(2024, 8, 1),
                'end_date':   datetime.date(2025, 5, 31),
                'is_current': True,
            }
        )

        # ── Programs ─────────────────────────────────────────────────────────
        bscs, _ = Program.objects.get_or_create(
            code='BSCS',
            defaults={
                'name': 'Bachelor of Science in Computer Science',
                'duration': 4, 'total_fee': 12000.00,
            }
        )
        bsba, _ = Program.objects.get_or_create(
            code='BSBA',
            defaults={
                'name': 'Bachelor of Science in Business Administration',
                'duration': 4, 'total_fee': 10000.00,
            }
        )

        # ── Users ─────────────────────────────────────────────────────────────
        registrar, _ = User.objects.get_or_create(
            email='registrar@school.edu',
            defaults={
                'first_name': 'Regina', 'last_name': 'Santos',
                'role': User.REGISTRAR, 'is_staff': True,
            }
        )
        registrar.set_password('password123'); registrar.save()

        teacher, _ = User.objects.get_or_create(
            email='teacher@school.edu',
            defaults={
                'first_name': 'Thomas', 'last_name': 'Cruz',
                'role': User.TEACHER,
            }
        )
        teacher.set_password('password123'); teacher.save()

        student_user, _ = User.objects.get_or_create(
            email='student@school.edu',
            defaults={
                'first_name': 'Sam', 'last_name': 'Dela Cruz',
                'role': User.STUDENT,
            }
        )
        student_user.set_password('password123'); student_user.save()

        # ── Fee Types ────────────────────────────────────────────────────────
        tuition, _ = FeeType.objects.get_or_create(name='Tuition Fee')
        lab,     _ = FeeType.objects.get_or_create(name='Laboratory Fee')
        misc,    _ = FeeType.objects.get_or_create(name='Miscellaneous Fee')

        # ── Students ─────────────────────────────────────────────────────────
        students_data = [
            ('Maria',   'Reyes',   'maria.reyes@student.edu',   'female', bscs),
            ('Juan',    'Dela Cruz','juan.dc@student.edu',      'male',   bscs),
            ('Ana',     'Garcia',  'ana.garcia@student.edu',    'female', bsba),
            ('Carlos',  'Lopez',   'carlos.lp@student.edu',     'male',   bsba),
            ('Sofia',   'Martinez','sofia.mz@student.edu',      'female', bscs),
        ]

        created_students = []
        for i, (fn, ln, email, gender, prog) in enumerate(students_data, 1):
            s, created = Student.objects.get_or_create(
                email=email,
                defaults={
                    'student_number': f'STU-2024-{i:04d}',
                    'first_name': fn, 'last_name': ln,
                    'date_of_birth': datetime.date(2000 + i, 3, 15),
                    'gender': gender,
                    'program': prog,
                    'academic_year': year,
                    'year_level': 1,
                }
            )
            created_students.append(s)

        # ── Fee Records & Payments ────────────────────────────────────────────
        payment_scenarios = [0.80, 0.60, 0.40, 0.20, 1.0]  # % paid per student

        for student, pct in zip(created_students, payment_scenarios):
            for fee_type, amount in [(tuition, 8000), (lab, 2000), (misc, 1000)]:
                record, _ = FeeRecord.objects.get_or_create(
                    student=student,
                    fee_type=fee_type,
                    academic_year='2024-2025',
                    defaults={
                        'total_fee': amount,
                        'due_date': datetime.date(2024, 10, 31),
                    }
                )

                paid_amount = amount * pct
                if paid_amount > 0 and record.amount_paid == 0:
                    Payment.objects.create(
                        fee_record=record,
                        amount=paid_amount,
                        payment_method='cash' if pct < 0.6 else 'card',
                        payment_status=Payment.COMPLETED,
                        processed_by=registrar,
                        card_last_four='4242' if pct >= 0.6 else '',
                        card_type='Visa' if pct >= 0.6 else '',
                    )

        self.stdout.write(self.style.SUCCESS(
            '\n✅ Demo data seeded!\n'
            '\nLogin credentials:\n'
            '  registrar@school.edu / password123  (Registrar)\n'
            '  teacher@school.edu   / password123  (Teacher)\n'
            '  student@school.edu   / password123  (Student)\n'
        ))
