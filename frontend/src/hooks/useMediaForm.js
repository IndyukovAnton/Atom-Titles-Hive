import { useEffect, useCallback, useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '../api/media';
import { groupsApi } from '../api/groups';
import { AxiosError } from 'axios';
import { toast } from '@/utils/app-toast';
import { mediaSchema, } from '@/schemas/mediaSchema';
import { logger } from '@/utils/logger';
const DEFAULT_VALUES = {
    title: '',
    rating: 5,
    category: 'Movie',
    description: '',
    image: '',
    startDate: '',
    endDate: '',
    groupId: 'null',
    tags: [],
    genres: [],
};
export function useMediaForm({ isOpen, initialData, onSuccess, onClose, }) {
    const queryClient = useQueryClient();
    const [activeStep, setActiveStep] = useState('info');
    const [groups, setGroups] = useState([]);
    const [error, setError] = useState(null);
    const [coverMode, setCoverMode] = useState('search');
    const methods = useForm({
        resolver: zodResolver(mediaSchema),
        defaultValues: DEFAULT_VALUES,
    });
    const { handleSubmit, reset, setValue, trigger, control, formState: { isSubmitting }, } = methods;
    const currentCategory = useWatch({ control, name: 'category' });
    const currentImage = useWatch({ control, name: 'image' });
    const stepProgress = useMemo(() => {
        switch (activeStep) {
            case 'info':
                return 33;
            case 'details':
                return 66;
            case 'media':
                return 100;
            default:
                return 0;
        }
    }, [activeStep]);
    const loadGroups = useCallback(async () => {
        try {
            const data = await groupsApi.getAll();
            setGroups(data);
        }
        catch (e) {
            logger.error('Failed to load groups', e);
        }
    }, []);
    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveStep('info');
            if (initialData) {
                reset({
                    title: initialData.title,
                    rating: initialData.rating,
                    category: (initialData.category ||
                        'Movie'),
                    description: initialData.description || '',
                    image: initialData.image || '',
                    startDate: initialData.startDate || '',
                    endDate: initialData.endDate || '',
                    groupId: initialData.groupId,
                    tags: initialData.tags || [],
                    genres: initialData.genres || [],
                });
            }
            else {
                reset(DEFAULT_VALUES);
            }
            void loadGroups();
        }
    }, [isOpen, reset, initialData, loadGroups]);
    const handleFileUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Размер файла слишком велик (макс 5МБ)');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setValue('image', reader.result);
            };
            reader.readAsDataURL(file);
        }
    }, [setValue]);
    const getDateLabels = useCallback((category) => {
        switch (category) {
            case 'Book':
            case 'Manga':
                return { start: 'Начало чтения', end: 'Окончание', showEnd: true };
            case 'Movie':
            case 'Anime':
                return { start: 'Просмотрено', end: '', showEnd: false };
            case 'Series':
                return { start: 'Начало просмотра', end: 'Окончание', showEnd: true };
            case 'Game':
                return { start: 'Начало игры', end: 'Прохождение', showEnd: true };
            default:
                return { start: 'Дата начала', end: 'Дата окончания', showEnd: true };
        }
    }, []);
    const dateLabels = useMemo(() => getDateLabels(currentCategory || 'Movie'), [currentCategory, getDateLabels]);
    const onSubmit = useCallback(async (values) => {
        const data = values;
        setError(null);
        try {
            const dataToSend = {
                title: data.title,
                rating: data.rating,
                category: data.category,
            };
            if (data.description)
                dataToSend.description = data.description;
            if (data.image)
                dataToSend.image = data.image;
            if (data.startDate)
                dataToSend.startDate = data.startDate;
            if (data.endDate)
                dataToSend.endDate = data.endDate;
            if (data.groupId !== null && data.groupId !== undefined)
                dataToSend.groupId = data.groupId;
            if (data.tags)
                dataToSend.tags = data.tags;
            if (data.genres)
                dataToSend.genres = data.genres;
            // Источник не редактируется в форме — прокидываем как есть (напр. 'ai' из рекомендаций)
            if (initialData?.source)
                dataToSend.source = initialData.source;
            if (initialData?.id) {
                await mediaApi.update(initialData.id, dataToSend);
                toast.success('Запись успешно обновлена');
            }
            else {
                await mediaApi.create(dataToSend);
                toast.success('Запись успешно создана');
            }
            await queryClient.invalidateQueries({ queryKey: ['media'] });
            await queryClient.invalidateQueries({ queryKey: ['groups'] });
            onSuccess();
            onClose();
        }
        catch (err) {
            const axiosError = err;
            const errorMessage = axiosError.response?.data?.message || 'Не удалось сохранить запись';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    }, [onSuccess, onClose, initialData, queryClient]);
    const validateAndNext = useCallback(async (nextStep) => {
        const fieldsToValidate = [];
        if (nextStep === 'details') {
            fieldsToValidate.push('title', 'category', 'rating');
        }
        if (fieldsToValidate.length > 0) {
            const isValid = await trigger(fieldsToValidate);
            if (!isValid)
                return;
        }
        setActiveStep(nextStep);
    }, [trigger]);
    const groupOptions = useMemo(() => [
        { value: 'null', label: 'Без группы' },
        ...groups.map((g) => ({ value: g.id.toString(), label: g.name })),
    ], [groups]);
    return {
        // Form methods
        methods,
        handleSubmit,
        setValue,
        isSubmitting,
        control,
        // State
        activeStep,
        setActiveStep,
        groups,
        error,
        coverMode,
        setCoverMode,
        stepProgress,
        currentCategory,
        currentImage,
        dateLabels,
        groupOptions,
        // Handlers
        loadGroups,
        handleFileUpload,
        onSubmit,
        validateAndNext,
    };
}
