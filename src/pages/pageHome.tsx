import { useState, useEffect } from 'react';

import { TabsList } from "@/components/TabsList/TabsList";
import { CollectionList } from "@/components/CollectionList/CollectionList";

import { Button } from "@/components/Button/Button";

import { FormAddCollectionItem } from "@/components/Forms/FormAddCollections/FormAddCollection"
import { FormDeleteCollection } from "@/components/Forms/delete-collection";

import { FormAddGroup } from "@/components/Forms/FormAddGroup/FormAddGroup";
import { FormDeleteGroup } from "@/components/Forms/delete-group";

import { getApiGroups } from "@/api/groups.api";
import { getApiCollections } from "@/api/collections.api";

import "@/assets/css/components/modal-window.css"
import type { IGroup } from "@/types/group.interface";
import type { ICollection } from "@/types/collections.interface";

const HomePage = ()=> {
	// TODO сделать store, а также, контексты для данных и тем

	const [collections, setСollections] = useState<ICollection[]>([]);
	const [groups, setGroups] = useState<IGroup[]>([]);
	const [loading, setLoading] = useState(1);
	const [activeCollection, setActiveCollection] = useState<string>('null')

	const [formAddItemIsOpen, openFormAddItem] = useState(false)
	const [formAddGroupIsOpen, openFormAddGroup] = useState(false)
	const [formDeleteCollectionIsOpen, openFormDeleteCollection] = useState(false)
	const [formDeleteGroupIsOpen, openFormDeleteGroup] = useState(false)

	const [deleteColectionId, setDeleteColectionId] = useState('')
	const [deleteGroupTag, setDeleteGroupTag] = useState('')

	function switchActiveCollection(event: React.MouseEvent<HTMLButtonElement>) {
		if (event.currentTarget.dataset.tab) {
			setActiveCollection(event.currentTarget.dataset.tab)
		}
	}

	useEffect(() => {
		const onLoadCallback = (data: IGroup[])=> {
			setGroups(data);
			setLoading(0);
		}

		const onErrorCallback = (error: unknown)=> {
			console.error('Ошибка:', error);
			setLoading(-1);
		}

		getApiGroups({onLoadCallback, onErrorCallback})
	}, []);

	useEffect(() => {
		const onLoadCallback = (data: ICollection[])=> {
			setСollections(data);
			setLoading(0);
		}

		const onErrorCallback = (error: unknown)=> {
			console.error('Ошибка:', error);
			setLoading(-1);
		}

		getApiCollections({onLoadCallback, onErrorCallback})
	}, []);

	switch (loading) {
		case 1:
			return <p className="loading">Загрузка...</p>;
		case -1:
			return <p className="error">Произошла ошибка во время загрузки!</p>;
	}

	function openDeleteCollectionModal(event: React.MouseEvent<HTMLButtonElement>){

		const id: string = event.currentTarget.closest('.collection__item')?.getAttribute('id') || ''

		setDeleteColectionId(id)
		openFormDeleteCollection(true)
	}

	function openDeleteGroupModal(event: React.MouseEvent<HTMLImageElement>){

		const tag: string = event.currentTarget.closest('.tab')?.getAttribute('data-tab') || ''

		setDeleteGroupTag(tag)
		openFormDeleteGroup(true)
	}

	return (
		<div className="home">
			<div className="top__buttons">
				<Button onClick={()=> {openFormAddItem(true)}}>
					<span>Добавить тайтл</span>
				</Button>

				<Button onClick={()=> {openFormAddGroup(true)}}>
					<span>Добавить группу</span>
				</Button>
			</div>

			<TabsList tabs={groups} active={activeCollection} clickHandler={switchActiveCollection} deleteHandler={openDeleteGroupModal}></TabsList>

			{groups.map((group, index) => {
				return (
					<CollectionList key={index} group={`${group.tag}`} collections={collections} activeGroup={activeCollection} deleteHandler={openDeleteCollectionModal}/>
				)
			})}

			{/* TODO: вынести модалки в portal */}

			<div className={"modal-window" + (formAddItemIsOpen ? " opened" : " closed")}>
				<div className="modal-window__overlay" onClick={()=> { openFormAddItem(false) }}></div>
				<div className="modal-window__wrapper">
					<button className="modal-window__close" onClick={() => { openFormAddItem(false) }}>
						<img src="img/icons/icon-cross.svg" alt="close" />
					</button>
					<div className="modal-window__content">
						<FormAddCollectionItem groups={groups}/>
					</div>
				</div>
			</div>

			<div className={"modal-window" + (formAddGroupIsOpen ? " opened" : " closed")}>
				<div className="modal-window__overlay" onClick={()=> { openFormAddGroup(false) }}></div>
				<div className="modal-window__wrapper">
					<button className="modal-window__close" onClick={() => { openFormAddGroup(false) }}>
						<img src="img/icons/icon-cross.svg" alt="close" />
					</button>
					<div className="modal-window__content">
						<FormAddGroup/>
					</div>
				</div>
			</div>

			<div className={"modal-window" + (formDeleteCollectionIsOpen ? " opened" : " closed")}>
				<div className="modal-window__overlay" onClick={()=> {openFormDeleteCollection(false)}}></div>
				<div className="modal-window__wrapper">
					<button className="modal-window__close" onClick={() => {openFormDeleteCollection(false)}}>
						<img src="img/icons/icon-cross.svg" alt="close" />
					</button>
					<div className="modal-window__content">
						<FormDeleteCollection collectionId={deleteColectionId} />
					</div>
				</div>
			</div>

			<div className={"modal-window" + (formDeleteGroupIsOpen ? " opened" : " closed")}>
				<div className="modal-window__overlay" onClick={()=> {openFormDeleteGroup(false)}}></div>
				<div className="modal-window__wrapper">
					<button className="modal-window__close" onClick={() => {openFormDeleteGroup(false)}}>
						<img src="img/icons/icon-cross.svg" alt="close" />
					</button>
					<div className="modal-window__content">
						<FormDeleteGroup groupTag={deleteGroupTag} />
					</div>
				</div>
			</div>
		</div>
	)
}

export { HomePage }